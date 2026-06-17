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

const PROMPT_REDES =
  "Cinematic hero shot of this exact motorcycle on a dark premium studio background " +
  "(near-black #0b0b0c with subtle red rim light #E2231A), dramatic low-key lighting, " +
  "moody reflections, slight haze, lots of negative space for text on the left. " +
  "Keep the bike identical. Photorealistic, editorial, high-end automotive ad look. " +
  "Vertical 4:5. Do not alter model, colors, decals or proportions.";

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
  if (!foto.type.startsWith("image/")) {
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
  const extension = foto.name.split(".").pop() ?? "jpg";
  const nombreArchivo = `raw/${archivoId}.${extension}`;

  const bytes = await foto.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await sb.storage
    .from("catalogo")
    .upload(nombreArchivo, buffer, {
      contentType: foto.type,
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
