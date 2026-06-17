import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const KIE_BASE = "https://api.kie.ai/api/v1";
const POST_SIZE = 1080; // lado del post cuadrado de Instagram

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
    // resultJson llega como string JSON — hay que parsearlo
    let resultJson: Record<string, unknown> = {};
    try {
      const raw = data?.resultJson;
      resultJson = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown> ?? {});
    } catch { /* resultJson queda vacío */ }

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

    // Para posts: cuadrar 1:1 (Instagram) y componer el logo Red Motos en la
    // esquina superior izquierda. Se hace con sharp (logo EXACTO, sin que el
    // modelo lo distorsione). Si algo falla, se sube la imagen sin logo.
    if (esPost) {
      try {
        const lienzo = await sharp(imagenBuffer)
          .resize(POST_SIZE, POST_SIZE, { fit: "cover", position: "centre" })
          .png()
          .toBuffer();

        const logoRes = await fetch(
          `${req.nextUrl.origin}/logos/red-motos-logo.webp`,
        );
        if (logoRes.ok) {
          const logoSrc = Buffer.from(await logoRes.arrayBuffer());
          const logo = await sharp(logoSrc)
            .resize({ width: Math.round(POST_SIZE * 0.2) })
            .png()
            .toBuffer();
          const pad = Math.round(POST_SIZE * 0.05);
          imagenBuffer = await sharp(lienzo)
            .composite([{ input: logo, top: pad, left: pad }])
            .png()
            .toBuffer();
        } else {
          imagenBuffer = lienzo;
        }
      } catch (err) {
        console.error("[kie-status] No se pudo componer el logo del post:", err);
        // continúa con la imagen original sin logo
      }
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
