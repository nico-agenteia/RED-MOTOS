import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { componerPostInstagram } from "@/lib/componer-post";

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

    // El estilo "Redes" del Estudio de fotos ("foto-redes") se compone con la
    // plantilla de marca de Instagram. Se decide por el query param `estilo`
    // (el frontend lo conoce siempre) con fallback al tipo guardado en BD, para
    // no depender de que el registro en ia_tareas exista/se haya leído bien.
    const estiloParam = req.nextUrl.searchParams.get("estilo");
    const aplicarPlantilla =
      estiloParam === "redes" || tarea?.tipo === "foto-redes";

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

    // Post de Instagram: armar la plantilla de marca (Satori) sobre la moto.
    // Catálogo / redes: solo se entrega liviano en WebP.
    let extensionSalida = "png";
    let contentTypeSalida = "image/png";

    if (aplicarPlantilla) {
      try {
        imagenBuffer = await componerPostInstagram(imagenBuffer);
        extensionSalida = "webp";
        contentTypeSalida = "image/webp";
      } catch (err) {
        console.error("[kie-status] No se pudo componer el post:", err);
        try {
          const sharp = (await import("sharp")).default;
          imagenBuffer = await sharp(imagenBuffer)
            .resize(1080, 1080, { fit: "cover", position: "centre" })
            .webp({ quality: 85 })
            .toBuffer();
          extensionSalida = "webp";
          contentTypeSalida = "image/webp";
        } catch {
          /* se sube la imagen original sin convertir */
        }
      }
    } else {
      // Catálogo / redes: entregar liviano en WebP.
      try {
        const sharp = (await import("sharp")).default;
        imagenBuffer = await sharp(imagenBuffer)
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        extensionSalida = "webp";
        contentTypeSalida = "image/webp";
      } catch (err) {
        console.error("[kie-status] No se pudo convertir a WebP:", err);
      }
    }

    // Subir al bucket correcto según tipo de tarea
    const bucket = aplicarPlantilla ? "posts" : "catalogo";
    const nombreArchivo = `ia-${taskId}.${extensionSalida}`;
    const { error: uploadError } = await sb.storage
      .from(bucket)
      .upload(nombreArchivo, imagenBuffer, {
        contentType: contentTypeSalida,
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

    return NextResponse.json({ estado: "listo", imagenUrl });
  }

  // Estado desconocido — seguir polling
  return NextResponse.json({ estado: "procesando" });
}
