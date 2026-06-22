import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  DIAS_AGENDABLES,
  TZ_SANTIAGO,
  slotsDeFecha,
} from "@/lib/servicios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SlotDisp {
  hora: string;
  estado: "libre" | "ocupado";
}
interface DiaDisp {
  fecha: string;
  slots: SlotDisp[];
}

/** Fecha de hoy en Santiago como 'YYYY-MM-DD'. */
function hoySantiago(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_SANTIAGO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Hora actual en Santiago (0-23). */
function horaActualSantiago(): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ_SANTIAGO,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return parseInt(h, 10);
}

/** Suma días a una fecha 'YYYY-MM-DD' (cálculo en UTC, sin desfase). */
function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/citas/disponibilidad?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Público. Devuelve los días con slots y si cada slot está libre u ocupado,
 * descontando las citas no canceladas (disponibilidad en tiempo real).
 */
export async function GET(req: NextRequest) {
  const hoy = hoySantiago();
  const horaActual = horaActualSantiago();

  const desdeParam = req.nextUrl.searchParams.get("desde");
  const hastaParam = req.nextUrl.searchParams.get("hasta");
  // Nunca antes de hoy.
  const desde = desdeParam && desdeParam > hoy ? desdeParam : hoy;
  const hasta = hastaParam || sumarDias(hoy, DIAS_AGENDABLES);

  // Slots ya tomados en el rango.
  const ocupados = new Set<string>();
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("citas")
      .select("fecha, hora, estado")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .neq("estado", "cancelada");
    if (error) throw error;
    for (const f of data ?? []) {
      if (f.fecha && f.hora) ocupados.add(`${f.fecha} ${f.hora}`);
    }
  } catch (err) {
    console.error("[GET /api/citas/disponibilidad]", err);
    // Si falla la consulta, devolvemos los slots como libres (degradación suave).
  }

  const dias: DiaDisp[] = [];
  let cursor = desde;
  while (cursor <= hasta) {
    const slotsBase = slotsDeFecha(cursor);
    const slots: SlotDisp[] = slotsBase
      // En el día de hoy, ocultar horas que ya pasaron.
      .filter((hora) => cursor !== hoy || parseInt(hora, 10) > horaActual)
      .map((hora) => ({
        hora,
        estado: ocupados.has(`${cursor} ${hora}`) ? "ocupado" : "libre",
      }));
    if (slots.length > 0) dias.push({ fecha: cursor, slots });
    cursor = sumarDias(cursor, 1);
  }

  return NextResponse.json({ dias });
}
