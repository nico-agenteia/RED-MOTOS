import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizarResultado, webhookAutorizado } from "@/lib/autofin";

// nodejs: lee el secreto del webhook y escribe a Supabase (solo server).
export const runtime = "nodejs";

/**
 * POST /api/autofin/resultado → notificación de inyección + evaluación (§3.3).
 * Autofin la llama con el ResumenSpider. Validamos el secreto, normalizamos
 * (solo datos necesarios, sin renta/datos laborales) y hacemos upsert por
 * IdTrinidad en `solicitudes_autofin`, cruzando con el lead vía CodigoExterno.
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

  const d = normalizarResultado(body);
  if (d.idTrinidad === null) {
    return NextResponse.json({ error: "Falta IdTrinidad" }, { status: 422 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from("solicitudes_autofin").upsert(
      {
        id_trinidad: d.idTrinidad,
        lead_id: d.leadId,
        estado_evaluacion: d.estadoEvaluacion,
        estado_trinidad: d.estadoTrinidad,
        producto: d.producto,
        marca: d.marca,
        modelo: d.modelo,
        anio: d.anio,
        estado_vehiculo: d.estadoVehiculo,
        precio: d.precio,
        pie: d.pie,
        plazo: d.plazo,
        valor_cuota: d.valorCuota,
        cae: d.cae,
        nombre: d.nombre,
        rut: d.rut,
        email: d.email,
        telefono: d.telefono,
        dealer: d.dealer,
      },
      { onConflict: "id_trinidad" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/autofin/resultado]", err);
    return NextResponse.json(
      { error: "Error al guardar la solicitud" },
      { status: 500 },
    );
  }
}
