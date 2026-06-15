import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";

const esquemaLead = z.object({
  origen: z.enum(["recomendador", "simulador", "contacto"]),
  nombre: z.string().optional(),
  whatsapp: z.string().optional(),
  presupuesto: z.string().optional(),
  uso: z.string().optional(),
  experiencia: z.string().optional(),
  urgencia: z.string().optional(),
  score: z.enum(["hot", "warm", "cold"]).optional(),
  payload: z.record(z.unknown()).optional(),
});

/** POST → capturar lead. Público (viene desde formularios del sitio). */
export async function POST(req: NextRequest) {
  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const resultado = esquemaLead.safeParse(datos);
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Validación falló", detalles: resultado.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from("leads").insert({
      origen: resultado.data.origen,
      nombre: resultado.data.nombre ?? null,
      whatsapp: resultado.data.whatsapp ?? null,
      presupuesto: resultado.data.presupuesto ?? null,
      uso: resultado.data.uso ?? null,
      experiencia: resultado.data.experiencia ?? null,
      urgencia: resultado.data.urgencia ?? null,
      score: resultado.data.score ?? null,
      payload: resultado.data.payload ?? null,
      atendido: false,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Error al guardar el lead" }, { status: 500 });
  }
}

/** GET → listar leads (solo admin). */
export async function GET(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = req.nextUrl;
  const score = url.searchParams.get("score");
  const atendido = url.searchParams.get("atendido");

  try {
    const sb = getSupabase();
    let query = sb.from("leads").select("*").order("creado_en", { ascending: false }).limit(200);

    if (score) query = query.eq("score", score);
    if (atendido !== null) query = query.eq("atendido", atendido === "true");

    const { data, error } = await query;
    if (error) throw error;

    const leads = (data ?? []).map((f) => ({
      id: f.id as string,
      origen: f.origen as string,
      nombre: f.nombre as string | null,
      whatsapp: f.whatsapp as string | null,
      presupuesto: f.presupuesto as string | null,
      uso: f.uso as string | null,
      experiencia: f.experiencia as string | null,
      urgencia: f.urgencia as string | null,
      score: f.score as string | null,
      atendido: Boolean(f.atendido),
      creadoEn: f.creado_en as string,
    }));

    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: "Error al obtener leads" }, { status: 500 });
  }
}

/** PATCH ?id= → marcar como atendido. */
export async function PATCH(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  try {
    const sb = getSupabase();
    const { error } = await sb.from("leads").update({ atendido: true }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/leads]", err);
    return NextResponse.json({ error: "Error al actualizar lead" }, { status: 500 });
  }
}
