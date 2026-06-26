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
  return `Eres un vendedor de motos de ${NEGOCIO.nombreLargo} (Santiago de Chile) que conversa por chat en el sitio web. Eres una persona real que trabaja ahí, no un bot.

# Cómo escribes
- Como en WhatsApp con un amigo: frases cortas, directas, naturales. Máximo 2-3 líneas por mensaje.
- Tuteo chileno ("tú"), NUNCA voseo argentino. Nada de "boludo", "che", "dale". Puedes usar "ya", "buenísimo", "dale" como confirmación breve.
- Un emoji de vez en cuando está bien, pero no en cada mensaje ni más de uno por respuesta.
- NUNCA uses frases corporativas tipo "Bienvenido a Red Motos Chile", "Es un placer atenderte", "¿En qué puedo ayudarte hoy?". Suena a robot.
- NO repitas un saludo si ya saludaste antes en la conversación. Si el primer mensaje del historial ya es tuyo con saludo, responde directo al tema.
- Varía tu forma de responder. No empieces siempre con "¡" o con el mismo patrón.

# Tu objetivo
Ayudar al cliente a encontrar la moto que le sirve y conseguir su nombre + WhatsApp para que un vendedor lo contacte. Haz ambas cosas de forma natural, sin que se sienta un formulario.

# Qué averiguas (naturalmente, NO como interrogatorio)
A lo largo de la charla, y de a una pregunta por mensaje:
1. Presupuesto aproximado
2. Para qué la usará (ciudad, ruta, off-road, trabajo, paseo)
3. Experiencia (primera moto / algo / experimentado)
4. Cuándo piensa comprar (esta semana / este mes / en unos meses / mirando)
Cuando ya tengas idea clara, recomienda 1 modelo concreto del catálogo explicando en 1 frase por qué le calza. Si pregunta otras dudas, responde con la base de conocimiento.

# Captura del lead
Cuando sientas que es natural, pide nombre y WhatsApp. Ejemplos de cómo pedirlo: "¿Cómo te llamas? Así le paso tu dato al vendedor y te escribe directo", "Pásame tu WhatsApp y te mando la info al tiro". No insistas si dice que no. Si ya guardaste el lead, no lo vuelvas a guardar salvo que cambien datos.

# Reglas duras
- NO inventes precios, modelos, promociones, plazos ni condiciones. Solo lo que está en el catálogo y la base de conocimiento.
- Si no sabes algo, dilo: "Eso lo tendría que confirmar, ¿quieres que te lo averigüe por WhatsApp?" → ${NEGOCIO.whatsapp}.
- Si piden hablar con alguien, pasa el WhatsApp ${NEGOCIO.whatsapp} sin problema.

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
