import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { CATALOGO } from "@/lib/catalogo";
import type { Moto } from "@/lib/tipos";

const KIE_BASE = "https://api.kie.ai/api/v1";

// El logo se compone aparte (en /api/kie-status, con sharp), por eso el prompt
// pide dejar la esquina SUPERIOR IZQUIERDA limpia y NO dibujar logos ni texto.
const PROMPTS_KIE: Record<string, string> = {
  catalogo:
    "Instagram post, square 1:1, of this exact motorcycle — unchanged model, colors and badges. " +
    "Premium studio background with a tasteful color gradient that makes the bike pop, " +
    "soft studio lighting, the motorcycle is the clear hero, centered and slightly lower in frame. " +
    "Keep the TOP-LEFT area clean and uncluttered (reserved for a logo). " +
    "No text, no watermarks, no logos in the image. Photorealistic, sharp, high-end commercial look. " +
    "Keep the bike identical, do not alter model, colors, decals or proportions.",
  redes:
    "Eye-catching cinematic Instagram post, square 1:1, of this exact motorcycle. " +
    "Dramatic high-contrast background where the motorcycle clearly stands out (dark moody scene " +
    "with a strong accent glow and rim light), the bike is the hero. " +
    "Keep the TOP-LEFT corner clean and uncluttered (reserved for a logo) and leave negative space for text. " +
    "No text, no watermarks, no logos in the image. Photorealistic, editorial, premium automotive ad look. " +
    "Keep the bike identical, do not alter model, colors, decals or proportions.",
};

async function getMotoById(id: string): Promise<Moto | null> {
  try {
    const sb = getSupabase();
    const { data } = await sb.from("motos").select("*").eq("id", id).single();
    if (!data) return null;
    return {
      id: data.id,
      marca: data.marca,
      modelo: data.modelo,
      segmento: data.segmento,
      cc: data.cc,
      precioLista: data.precio_lista,
      precioBono: data.precio_bono ?? null,
      bonoVence: data.bono_vence ?? null,
      img: data.img,
      usos: data.usos ?? [],
      aptaPrincipiante: data.apta_principiante ?? false,
      destacado: data.destacado ?? false,
      orden: data.orden ?? 0,
    };
  } catch {
    return CATALOGO.find((m) => m.id === id) ?? null;
  }
}

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

async function generarCaption(moto: Moto, estilo: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const precio = moto.precioBono
    ? `precio con descuento ${formatCLP(moto.precioBono)} (antes ${formatCLP(moto.precioLista)})`
    : `precio ${formatCLP(moto.precioLista)}`;

  const usosTexto = moto.usos?.length ? moto.usos.join(", ") : "uso general";
  const principiante = moto.aptaPrincipiante ? "Apta para principiantes." : "";

  const estiloInstruccion =
    estilo === "catalogo"
      ? "Caption comercial directo: modelo, precio y llamado a la acción. Tono confiado, información clara. Máximo 3 líneas + hashtags."
      : "Caption aspiracional para redes sociales: evoca emoción, libertad, la experiencia de manejar. Tono inspirador. NO mencionar precio. Máximo 4 líneas + hashtags.";

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Eres el community manager de Red Motos Chile, tienda especializada en motos de marcas como Royal Enfield, Suzuki, Kymco y más.

Genera un caption para Instagram sobre la ${moto.marca} ${moto.modelo}.
- Segmento: ${moto.segmento}
- Motor: ${moto.cc}cc
- Usos principales: ${usosTexto}
- ${precio}
- ${principiante}

Instrucción de estilo: ${estiloInstruccion}

Reglas:
- Escribir en español (Chile)
- Emojis con moderación (2-3 máximo)
- Terminar con 8-10 hashtags en línea aparte
- Sin comillas ni formato especial, solo texto plano

Devuelve únicamente el caption, sin explicaciones.`,
      },
    ],
  });

  const bloque = msg.content[0];
  return bloque.type === "text" ? bloque.text.trim() : "";
}

export async function POST(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json({ error: "KIE_API_KEY no configurada" }, { status: 503 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 503 });
  }

  let body: { motoId?: string; estilo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { motoId, estilo = "catalogo" } = body;
  if (!motoId) {
    return NextResponse.json({ error: "Falta motoId" }, { status: 400 });
  }

  const moto = await getMotoById(motoId);
  if (!moto) {
    return NextResponse.json({ error: "Moto no encontrada" }, { status: 404 });
  }

  // Generar caption con Claude (falla silenciosamente al fallback)
  let caption = "";
  try {
    caption = await generarCaption(moto, estilo);
  } catch (err) {
    console.error("Error generando caption con Claude:", err);
    caption = `${moto.marca} ${moto.modelo} — ${moto.segmento} ${moto.cc}cc.\n\n#RedMotos #${moto.marca.replace(/\s/g, "")} #motos #motosChile`;
  }

  // Iniciar tarea en KIE.AI con la imagen actual de la moto
  const kiePrompt = PROMPTS_KIE[estilo] ?? PROMPTS_KIE.catalogo;
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
          prompt: kiePrompt,
          image_urls: [moto.img],
        },
      }),
    });

    const kieData = await kieRes.json().catch(() => null);
    if (!kieRes.ok || !kieData?.data?.taskId) {
      return NextResponse.json({ error: "KIE.AI no pudo iniciar la tarea" }, { status: 502 });
    }
    taskId = kieData.data.taskId as string;
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con KIE.AI" }, { status: 502 });
  }

  // Registrar en ia_tareas con tipo "post" y caption en meta
  try {
    await getSupabase().from("ia_tareas").insert({
      tipo: "post",
      task_id: taskId,
      estado: "procesando",
      input_url: moto.img,
      meta: {
        caption,
        motoId,
        estilo,
        marcaModelo: `${moto.marca} ${moto.modelo}`,
      },
    });
  } catch (err) {
    console.error("Error registrando ia_tarea:", err);
  }

  return NextResponse.json({ taskId });
}
