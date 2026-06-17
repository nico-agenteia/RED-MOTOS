import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import type { SolicitudAutofin } from "@/lib/tipos";

export const runtime = "nodejs";

function filaASolicitud(f: Record<string, unknown>): SolicitudAutofin {
  return {
    id: f.id as string,
    idTrinidad: (f.id_trinidad as number | null) ?? null,
    leadId: (f.lead_id as string | null) ?? null,
    estadoEvaluacion: (f.estado_evaluacion as string | null) ?? null,
    estadoTrinidad: (f.estado_trinidad as string | null) ?? null,
    codEstado: (f.cod_estado as number | null) ?? null,
    resolucion: (f.resolucion as string | null) ?? null,
    producto: (f.producto as string | null) ?? null,
    marca: (f.marca as string | null) ?? null,
    modelo: (f.modelo as string | null) ?? null,
    anio: (f.anio as number | null) ?? null,
    precio: (f.precio as number | null) ?? null,
    pie: (f.pie as number | null) ?? null,
    plazo: (f.plazo as number | null) ?? null,
    valorCuota: (f.valor_cuota as number | null) ?? null,
    cae: (f.cae as string | null) ?? null,
    nombre: (f.nombre as string | null) ?? null,
    rut: (f.rut as string | null) ?? null,
    email: (f.email as string | null) ?? null,
    telefono: (f.telefono as string | null) ?? null,
    atendido: Boolean(f.atendido),
    creadoEn: f.creado_en as string,
  };
}

/** GET → listar solicitudes de financiamiento (solo admin). */
export async function GET(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const estado = req.nextUrl.searchParams.get("estado");

  try {
    const sb = getSupabase();
    let query = sb
      .from("solicitudes_autofin")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(300);

    if (estado) query = query.eq("estado_evaluacion", estado);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      solicitudes: (data ?? []).map(filaASolicitud),
    });
  } catch (err) {
    console.error("[GET /api/solicitudes]", err);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes" },
      { status: 500 },
    );
  }
}

/** PATCH ?id= → marcar como atendida. */
export async function PATCH(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  try {
    const sb = getSupabase();
    const { error } = await sb
      .from("solicitudes_autofin")
      .update({ atendido: true })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/solicitudes]", err);
    return NextResponse.json(
      { error: "Error al actualizar la solicitud" },
      { status: 500 },
    );
  }
}
