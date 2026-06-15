import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const KIE_BASE = "https://api.kie.ai/api/v1";

export async function GET(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "KIE_API_KEY no está configurada" },
      { status: 503 },
    );
  }

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Falta taskId" }, { status: 400 });
  }

  // Consultar estado en KIE
  let kieData: Record<string, unknown>;
  try {
    const kieRes = await fetch(
      `${KIE_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` },
        cache: "no-store",
      },
    );
    const raw = await kieRes.json().catch(() => null);
    if (!kieRes.ok || !raw) {
      return NextResponse.json(
        { error: "Error consultando KIE.AI" },
        { status: 502 },
      );
    }
    kieData = raw as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con KIE.AI" },
      { status: 502 },
    );
  }

  const data = kieData.data as Record<string, unknown> | undefined;
  const state = data?.state as string | undefined;

  // Todavía procesando
  if (!state || state === "pending" || state === "processing" || state === "running") {
    return NextResponse.json({ estado: "procesando" });
  }

  // Error en KIE
  if (state === "failed" || state === "error") {
    await getSupabase()
      .from("ia_tareas")
      .update({ estado: "error" })
      .eq("task_id", taskId);
    return NextResponse.json({ error: "KIE.AI reportó error en la tarea" }, { status: 500 });
  }

  // Éxito — descargar resultado y subir a Storage
  if (state === "success") {
    const resultJson = data?.resultJson as Record<string, unknown> | undefined;
    const resultUrls = resultJson?.resultUrls as string[] | undefined;
    const imageUrlKie = resultUrls?.[0];

    if (!imageUrlKie) {
      return NextResponse.json({ error: "KIE no devolvió URL de resultado" }, { status: 500 });
    }

    const sb = getSupabase();

    // Leer tarea para saber el tipo y el caption (si existe)
    let tarea: { tipo: string; meta: unknown } | null = null;
    try {
      const { data } = await sb
        .from("ia_tareas")
        .select("tipo, meta")
        .eq("task_id", taskId)
        .single();
      tarea = data;
    } catch { /* continuar sin datos de tarea */ }

    const esPost = tarea?.tipo === "post";
    const meta = tarea?.meta as Record<string, unknown> | null | undefined;
    const caption = meta?.caption as string | undefined;

    // Descargar imagen desde KIE
    let imagenBuffer: Buffer;
    try {
      const imgRes = await fetch(imageUrlKie);
      const arrayBuffer = await imgRes.arrayBuffer();
      imagenBuffer = Buffer.from(arrayBuffer);
    } catch {
      return NextResponse.json(
        { error: "No se pudo descargar la imagen de KIE" },
        { status: 502 },
      );
    }

    // Subir al bucket correcto según tipo de tarea
    const bucket = esPost ? "posts" : "catalogo";
    const nombreArchivo = `ia-${taskId}.png`;
    const { error: uploadError } = await sb.storage
      .from(bucket)
      .upload(nombreArchivo, imagenBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Error subiendo a Storage: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(nombreArchivo);
    const imagenUrl = urlData.publicUrl;

    // Actualizar ia_tareas
    await sb.from("ia_tareas").update({ estado: "listo", output_url: imagenUrl }).eq("task_id", taskId);

    return NextResponse.json({
      estado: "listo",
      imagenUrl,
      ...(caption ? { caption } : {}),
    });
  }

  // Estado desconocido — seguir polling
  return NextResponse.json({ estado: "procesando" });
}
