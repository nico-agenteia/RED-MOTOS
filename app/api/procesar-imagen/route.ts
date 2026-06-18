import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { FONDOS_MARCA } from "@/lib/marca-fondos";
import type { Marca } from "@/lib/tipos";

const KIE_BASE = "https://api.kie.ai/api/v1";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
// Build marker: v3 KIE input-wrapper + fondo por marca — fuerza redeploy

/** Prompt de catálogo con el fondo establecido de la marca seleccionada. */
function promptCatalogo(marca: Marca): string {
  const fondo =
    FONDOS_MARCA[marca]?.prompt ??
    "a clean dark seamless studio background, neutral charcoal gradient, soft rim light";
  return (
    "Studio product shot of this exact motorcycle, unchanged model/colors/badges. " +
    `Place it on ${fondo}. Seamless gradient studio background, soft even softbox lighting, ` +
    "subtle floor reflection, 3/4 front angle, centered, full vehicle in frame, " +
    "no people, no clutter, no text, no logos added. Photorealistic, high detail, sharp, " +
    "color-accurate. Square 1:1. Keep the bike identical, do not alter model, colors, " +
    "decals or proportions."
  );
}

// El estilo "Redes" se compone luego con la plantilla de Instagram (Satori),
// que cubre la franja superior e inferior con degradados oscuros para el texto.
// Por eso la moto debe quedar COMPLETA y centrada en la banda media, con margen
// generoso en los cuatro lados, y sobre un fondo que CONTRASTE con la moto.
const PROMPT_REDES =
  "Premium automotive advertisement, square 1:1 image of this exact motorcycle. " +
  "Show the COMPLETE motorcycle, fully visible with NOTHING cropped, as the hero, centered in the MIDDLE band of the frame. " +
  "Leave a comfortable empty margin around the entire bike on ALL FOUR sides, and extra empty space at the TOP and BOTTOM (reserved for text overlays); no wheel, mirror or any part may touch the image edges. " +
  "Background: a clean, bright, vividly-lit seamless studio backdrop whose color strongly CONTRASTS with the motorcycle's own body color " +
  "(use a bright warm or saturated colored backdrop for a dark or black bike; use a deep, richly saturated backdrop for a light, white or silver bike) — never a dull, muddy or low-contrast background. " +
  "High-key even studio lighting with a crisp rim light and a subtle floor reflection so the bike pops and clearly separates from the background. " +
  "No people, no clutter, no text, no watermarks, no logos. Photorealistic, editorial, color-accurate. " +
  "Keep the bike identical, do not alter model, colors, decals or proportions.";

/** Detecta HEIC/HEIF por tipo MIME, extensión o caja ftyp (magic bytes). */
function esHeic(buf: Buffer, nombre: string, tipo: string): boolean {
  if (/heic|heif/i.test(tipo)) return true;
  if (/\.(heic|heif)$/i.test(nombre)) return true;
  // ...ftyp<brand> en bytes 4–12; marcas HEIF conocidas
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const marca = buf.toString("ascii", 8, 12);
    return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(marca);
  }
  return false;
}

const MARCAS_VALIDAS = Object.keys(FONDOS_MARCA) as Marca[];

// Rate limit: máximo 20 llamadas por sesión al día (clave en memoria del proceso).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const DAILY_LIMIT = 20;

function checkRateLimit(sesionToken: string): boolean {
  const ahora = Date.now();
  const entrada = rateLimitMap.get(sesionToken);
  if (!entrada || ahora > entrada.resetAt) {
    rateLimitMap.set(sesionToken, {
      count: 1,
      resetAt: ahora + 24 * 60 * 60 * 1000,
    });
    return true;
  }
  if (entrada.count >= DAILY_LIMIT) return false;
  entrada.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "KIE_API_KEY no está configurada en .env.local" },
      { status: 503 },
    );
  }

  if (!checkRateLimit(sesion!)) {
    return NextResponse.json(
      { error: "Límite diario de 20 imágenes alcanzado. Vuelve mañana." },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const foto = formData.get("foto");
  const estilo = formData.get("estilo") as string | null;
  const marca = (formData.get("marca") as string | null) ?? "Royal Enfield";

  if (!foto || !(foto instanceof File)) {
    return NextResponse.json({ error: "Falta la foto (File)" }, { status: 422 });
  }
  if (!estilo || !["catalogo", "redes"].includes(estilo)) {
    return NextResponse.json(
      { error: "estilo debe ser 'catalogo' o 'redes'" },
      { status: 422 },
    );
  }
  if (estilo === "catalogo" && !MARCAS_VALIDAS.includes(marca as Marca)) {
    return NextResponse.json(
      { error: `marca inválida. Opciones: ${MARCAS_VALIDAS.join(", ")}` },
      { status: 422 },
    );
  }
  const esImagen =
    foto.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|heic|heif)$/i.test(foto.name);
  if (!esImagen) {
    return NextResponse.json(
      { error: "El archivo debe ser una imagen" },
      { status: 422 },
    );
  }
  if (foto.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen no puede superar los 8 MB" },
      { status: 422 },
    );
  }

  // 1. Subir la foto cruda al bucket público catalogo/ con prefijo raw/
  //    (bucket público: KIE puede acceder directamente sin URL firmada)
  const sb = getSupabase();
  const archivoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Normalizar el archivo subido a JPEG (auto-orientado por EXIF y con el tamaño
  // acotado), así KIE puede leerlo venga en el formato que venga (PNG, WebP,
  // AVIF, TIFF, HEIC…). Si sharp no logra decodificarlo, se sube el original.
  const original = Buffer.from(await foto.arrayBuffer());

  // iPhone sube HEIC/HEIF por defecto, y los binarios prebuilt de sharp/libvips
  // NO decodifican HEIF (licencia). KIE además rechaza el .heic crudo
  // ("image_urls file type not supported"). Lo convertimos a JPEG con
  // heic-convert (decodificador en JS puro) antes de pasarlo por sharp.
  let entrada = original;
  if (esHeic(original, foto.name, foto.type)) {
    try {
      const heicConvert = (await import("heic-convert")).default;
      const jpeg = await heicConvert({ buffer: original, format: "JPEG", quality: 0.92 });
      entrada = Buffer.from(jpeg);
    } catch (err) {
      console.error("[procesar-imagen] No se pudo convertir HEIC:", err);
      return NextResponse.json(
        { error: "No se pudo leer la imagen HEIC del teléfono. Prueba con una foto JPG o PNG." },
        { status: 422 },
      );
    }
  }

  let buffer: Buffer = entrada;
  let extension = "jpg";
  let contentType = "image/jpeg";
  try {
    const sharp = (await import("sharp")).default;
    buffer = await sharp(entrada)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    // entrada ya es JPEG si venía de HEIC; si no, subimos el original tal cual.
    buffer = entrada;
    if (entrada === original) {
      extension = (foto.name.split(".").pop() || "jpg").toLowerCase();
      contentType = foto.type || "application/octet-stream";
    }
  }
  const nombreArchivo = `raw/${archivoId}.${extension}`;

  const { error: uploadError } = await sb.storage
    .from("catalogo")
    .upload(nombreArchivo, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir la foto: ${uploadError.message}` },
      { status: 500 },
    );
  }

  // URL pública — accesible por KIE sin autenticación
  const { data: urlData } = sb.storage.from("catalogo").getPublicUrl(nombreArchivo);
  const inputImageUrl = urlData.publicUrl;

  // 2. Llamar a KIE createTask con el formato correcto
  let taskId: string;
  try {
    const kieRes = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/nano-banana-edit",
        input: {
          prompt:
            estilo === "catalogo"
              ? promptCatalogo(marca as Marca)
              : PROMPT_REDES,
          image_urls: [inputImageUrl],
        },
      }),
    });

    const kieData = await kieRes.json().catch(() => null);
    if (!kieRes.ok || !kieData?.data?.taskId) {
      const kieMsg = kieData?.msg ?? kieData?.message ?? kieData?.error ?? JSON.stringify(kieData);
      console.error("[KIE createTask] Error:", kieMsg);
      return NextResponse.json(
        { error: `KIE.AI: ${kieMsg}` },
        { status: 502 },
      );
    }
    taskId = kieData.data.taskId as string;
  } catch (err) {
    console.error("[KIE createTask] Network error:", err);
    return NextResponse.json(
      { error: "No se pudo conectar con KIE.AI" },
      { status: 502 },
    );
  }

  // 3. Registrar la tarea en ia_tareas
  await sb.from("ia_tareas").insert({
    tipo: estilo === "catalogo" ? "foto-catalogo" : "foto-redes",
    task_id: taskId,
    estado: "procesando",
    input_url: inputImageUrl,
    meta: { estilo, marca, archivo: nombreArchivo },
  });

  return NextResponse.json({ taskId });
}
