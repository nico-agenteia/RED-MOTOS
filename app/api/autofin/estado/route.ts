import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizarEstado, webhookAutorizado } from "@/lib/autofin";

// nodejs: lee el secreto del webhook y escribe a Supabase (solo server).
export const runtime = "nodejs";

/**
 * POST /api/autofin/estado → seguimiento de estado de la solicitud (§3.4).
 * Actualiza (upsert por IdTrinidad) el estado de workflow de la solicitud. Si el
 * resultado (§3.3) aún no llegó, deja una fila-stub que se completa luego.
 */
export async function POST(req: NextRequest) {
  if (!webhookAutorizado(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const e = normalizarEstado(body);
  if (e.idTrinidad === null) {
    return NextResponse.json({ error: "Falta IdTrinidad" }, { status: 422 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from("solicitudes_autofin").upsert(
      {
        id_trinidad: e.idTrinidad,
        estado_trinidad: e.estadoNuevo,
        cod_estado: e.codEstadoNuevo,
        resolucion: e.resolucion,
        fecha_cambio_estado: e.fechaCambioEstado,
      },
      { onConflict: "id_trinidad" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/autofin/estado]", err);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 },
    );
  }
}
