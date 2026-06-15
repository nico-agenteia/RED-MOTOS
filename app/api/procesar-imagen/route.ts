import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const KIE_BASE = "https://api.kie.ai/api/v1";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const PROMPTS: Record<string, string> = {
  catalogo:
    "Studio product shot of this exact motorcycle, unchanged model/colors/badges. " +
    "Clean seamless studio background, neutral light grey (#f2f2f2) to white, " +
    "soft even softbox lighting, subtle floor reflection, 3/4 front angle, " +
    "centered, full vehicle in frame, no people, no clutter, no text, no logos added. " +
    "Photorealistic, high detail, sharp, color-accurate. Square 1:1. " +
    "Keep the bike identical, do not alter model, colors, decals or proportions.",
  redes:
    "Cinematic hero shot of this exact motorcycle on a dark premium studio background " +
    "(near-black #0b0b0c with subtle red rim light #E2231A), dramatic low-key lighting, " +
    "moody reflections, slight haze, lots of negative space for text on the left. " +
    "Keep the bike identical. Photorealistic, editorial, high-end automotive ad look. " +
    "Vertical 4:5. Do not alter model, colors, decals or proportions.",
};

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

  if (!foto || !(foto instanceof File)) {
    return NextResponse.json({ error: "Falta la foto (File)" }, { status: 422 });
  }
  if (!estilo || !["catalogo", "redes"].includes(estilo)) {
    return NextResponse.json(
      { error: "estilo debe ser 'catalogo' o 'redes'" },
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
          prompt: PROMPTS[estilo],
          image_urls: [inputImageUrl],
        },
      }),
    });

    const kieData = await kieRes.json().catch(() => null);
    if (!kieRes.ok || !kieData?.data?.taskId) {
      console.error("[KIE createTask] Error:", JSON.stringify(kieData));
      return NextResponse.json(
        { error: kieData?.message ?? kieData?.error ?? "Error al enviar tarea a KIE.AI" },
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
    meta: { estilo, archivo: nombreArchivo },
  });

  return NextResponse.json({ taskId });
}
