import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { CATALOGO, precioVigente } from "@/lib/catalogo";
import { formatCLP, scoreLead } from "@/lib/utils";
import { conocimientoComoTexto } from "@/lib/conocimiento-faq";
import { NEGOCIO, SUCURSALES, HORARIO } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Modelo del asistente. Sonnet 4.6 da el mejor tono "humano" para conversar.
// Alternativa más barata para alto volumen: "claude-haiku-4-5".
const MODELO_IA = "claude-sonnet-4-6";
const MAX_TURNOS = 24; // límite de mensajes por conversación (anti-abuso)

const esquemaMensaje = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const esquemaBody = z.object({
  messages: z.array(esquemaMensaje).min(1).max(MAX_TURNOS),
  leadId: z.string().uuid().nullish(),
});

/** Catálogo resumido para el system prompt (sin inventar precios). */
function catalogoComoTexto(): string {
  return CATALOGO.filter((m) => !m.sinStock)
    .map(
      (m) =>
        `- [${m.id}] ${m.marca} ${m.modelo} · ${m.segmento} · ${m.cc}cc · ${formatCLP(
          precioVigente(m),
        )}${m.aptaPrincipiante ? " · apta principiante" : ""} · usos: ${m.usos.join(", ")}`,
    )
    .join("\n");
}

function systemPrompt(): string {
  return `Eres el asistente de ventas de ${NEGOCIO.nombreLargo}, una concesionaria de motos multimarca en Santiago de Chile. Conversas por chat en el sitio web.

# Tu personalidad
- Hablas como un chileno cercano y profesional: tuteo natural ("tú"), NUNCA voseo argentino. Nada de "boludo", "che", "dale". Usa "ya", "listo", "perfecto", "buenísimo".
- Cálido y resolutivo, mensajes CORTOS (1-3 frases). Una pregunta a la vez. Suenas humano, no robótico. Puedes usar 1 emoji ocasional, sin abusar.
- Tu objetivo: ayudar de verdad, recomendar una moto REAL del stock, y conseguir el nombre y WhatsApp del cliente para que un vendedor lo contacte.

# Cómo guías la conversación
Saluda y, de forma natural (no como interrogatorio), averigua a lo largo de la charla:
1. Presupuesto aproximado.
2. Para qué usará la moto (ciudad, ruta, off-road, trabajo, placer).
3. Su experiencia (primera moto / algo de experiencia / experimentado).
4. Cuándo planea comprar (esta semana / este mes / en 3 meses / solo mirando).
Cuando tengas una idea clara, recomienda 1 modelo concreto del catálogo (por marca y modelo) y explica brevemente por qué le calza. Si pregunta por dudas (garantía, pago, permuta, etc.), respóndelas con la base de conocimiento.

# Captura del lead (importante)
En cuanto tengas nombre + WhatsApp del cliente, llama a la herramienta guardar_lead con todos los datos que hayas reunido. Pide el contacto de forma natural ("¿A qué nombre y a qué WhatsApp le mando la info / el vendedor te escribe?"). No insistas de forma molesta. Si ya guardaste el lead en esta conversación, no lo vuelvas a guardar salvo que cambien datos importantes.

# Reglas duras
- NO inventes precios, modelos, promociones, plazos ni condiciones. Usa solo el catálogo y la base de conocimiento de abajo.
- Si te preguntan algo que no está en tu información, dilo con honestidad y ofrece confirmarlo por WhatsApp (${NEGOCIO.whatsapp}).
- Si piden hablar con una persona, comparte el WhatsApp ${NEGOCIO.whatsapp}.

# Datos del negocio
${SUCURSALES.map((s) => `- ${s.nombre}: ${s.direccion}`).join("\n")}
Horario: ${HORARIO.completo}
WhatsApp ventas: ${NEGOCIO.whatsapp} · Instagram: ${NEGOCIO.instagram}

# Catálogo (stock real — NO inventar fuera de esto)
${catalogoComoTexto()}

# Base de conocimiento (preguntas frecuentes)
${conocimientoComoTexto()}`;
}

const TOOL_GUARDAR_LEAD: Anthropic.Tool = {
  name: "guardar_lead",
  description:
    "Guarda los datos de contacto del cliente para que un vendedor lo contacte. Llamar SOLO cuando tengas al menos nombre y whatsapp.",
  input_schema: {
    type: "object",
    properties: {
      nombre: { type: "string", description: "Nombre del cliente" },
      whatsapp: { type: "string", description: "Número de WhatsApp del cliente" },
      presupuesto: { type: "string", description: "Presupuesto aproximado mencionado (opcional)" },
      uso: { type: "string", description: "Para qué usará la moto (opcional)" },
      experiencia: { type: "string", description: "Experiencia del cliente (opcional)" },
      urgencia: {
        type: "string",
        description:
          "Cuándo planea comprar: 'Esta semana', 'Este mes', 'En 3 meses' o 'Solo mirando' (opcional)",
      },
      modeloInteres: {
        type: "string",
        description: "Marca y modelo recomendado o de interés (opcional)",
      },
    },
    required: ["nombre", "whatsapp"],
  },
};

interface InputGuardarLead {
  nombre: string;
  whatsapp: string;
  presupuesto?: string;
  uso?: string;
  experiencia?: string;
  urgencia?: string;
  modeloInteres?: string;
}

/** Inserta o actualiza el lead en Supabase. Devuelve el leadId. */
async function guardarLead(
  input: InputGuardarLead,
  leadIdPrevio: string | null,
): Promise<string | null> {
  try {
    const sb = getSupabase();
    const fila = {
      origen: "recomendador" as const,
      nombre: input.nombre ?? null,
      whatsapp: input.whatsapp ?? null,
      presupuesto: input.presupuesto ?? null,
      uso: input.uso ?? null,
      experiencia: input.experiencia ?? null,
      urgencia: input.urgencia ?? null,
      score: input.urgencia ? scoreLead(input.urgencia) : "cold",
      payload: input.modeloInteres ? { modeloInteres: input.modeloInteres } : null,
    };

    if (leadIdPrevio) {
      const { error } = await sb.from("leads").update(fila).eq("id", leadIdPrevio);
      if (error) throw error;
      return leadIdPrevio;
    }

    const { data, error } = await sb
      .from("leads")
      .insert({ ...fila, atendido: false })
      .select("id")
      .single();
    if (error) throw error;
    return (data?.id as string) ?? null;
  } catch (err) {
    console.error("[guardarLead]", err);
    return leadIdPrevio;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "asistente_no_configurado",
        reply:
          "El asistente no está disponible en este momento. Escríbenos directo por WhatsApp y te atendemos al tiro 🙌",
      },
      { status: 503 },
    );
  }

  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = esquemaBody.safeParse(datos);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación falló", detalles: parsed.error.flatten() },
      { status: 422 },
    );
  }

  let leadId = parsed.data.leadId ?? null;
  const client = new Anthropic({ apiKey });

  const mensajes: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    // Bucle de tool use: como mucho 1 ronda de herramienta (guardar_lead) + respuesta.
    let modeloRecomendado: string | null = null;

    for (let i = 0; i < 3; i++) {
      const respuesta = await client.messages.create({
        model: MODELO_IA,
        max_tokens: 1024,
        system: systemPrompt(),
        tools: [TOOL_GUARDAR_LEAD],
        messages: mensajes,
      });

      if (respuesta.stop_reason === "tool_use") {
        // Ejecutar las herramientas y devolver resultados.
        const bloquesTool = respuesta.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );
        mensajes.push({ role: "assistant", content: respuesta.content });

        const resultados: Anthropic.ToolResultBlockParam[] = [];
        for (const bloque of bloquesTool) {
          if (bloque.name === "guardar_lead") {
            const input = bloque.input as InputGuardarLead;
            leadId = await guardarLead(input, leadId);
            if (input.modeloInteres) modeloRecomendado = input.modeloInteres;
            resultados.push({
              type: "tool_result",
              tool_use_id: bloque.id,
              content: leadId
                ? "Lead guardado correctamente."
                : "No se pudo guardar, pero continúa la conversación con normalidad.",
            });
          } else {
            resultados.push({
              type: "tool_result",
              tool_use_id: bloque.id,
              content: "Herramienta desconocida.",
              is_error: true,
            });
          }
        }
        mensajes.push({ role: "user", content: resultados });
        continue; // pedir la respuesta final tras la herramienta
      }

      // Respuesta de texto final.
      const texto = respuesta.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return NextResponse.json({
        reply:
          texto ||
          "Perdona, no te entendí bien. ¿Me lo puedes repetir? 🙂",
        leadId,
        modeloRecomendado,
      });
    }

    // Si agotó el bucle, respuesta de cortesía.
    return NextResponse.json({
      reply:
        "Listo, ya tengo tus datos. Un vendedor te contacta a la brevedad. ¿Algo más en lo que te pueda ayudar?",
      leadId,
      modeloRecomendado,
    });
  } catch (err) {
    console.error("[POST /api/recomendar]", err);
    return NextResponse.json(
      {
        error: "error_asistente",
        reply:
          "Tuvimos un problema técnico con el asistente. Escríbenos por WhatsApp y te ayudamos enseguida 🙌",
      },
      { status: 500 },
    );
  }
}
