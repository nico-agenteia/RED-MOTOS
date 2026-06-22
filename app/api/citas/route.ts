import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { slotsDeFecha } from "@/lib/servicios";
import type { Cita } from "@/lib/tipos";

export const runtime = "nodejs";

const esquemaCita = z.object({
  tipo: z.enum(["Mantenimiento", "Reparación"]),
  nombre: z.string().min(2).max(120),
  whatsapp: z.string().min(6).max(40),
  email: z.string().email().optional().or(z.literal("")),
  marca: z.string().max(80).optional(),
  modelo: z.string().max(120).optional(),
  descripcion: z.string().max(1000).optional(),
  precioEstimado: z.number().int().nonnegative().optional(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

function filaACita(f: Record<string, unknown>): Cita {
  return {
    id: f.id as string,
    tipo: f.tipo as string,
    nombre: f.nombre as string,
    whatsapp: f.whatsapp as string,
    email: (f.email as string | null) ?? null,
    marca: (f.marca as string | null) ?? null,
    modelo: (f.modelo as string | null) ?? null,
    descripcion: (f.descripcion as string | null) ?? null,
    precioEstimado: (f.precio_estimado as number | null) ?? null,
    fecha: (f.fecha as string | null) ?? null,
    hora: (f.hora as string | null) ?? null,
    estado: f.estado as string,
    atendido: Boolean(f.atendido),
    creadoEn: f.creado_en as string,
  };
}

/** POST → agendar / dejar datos de servicio. Público. */
export async function POST(req: NextRequest) {
  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = esquemaCita.safeParse(datos);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación falló", detalles: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const conSlot = Boolean(d.fecha && d.hora);

  // Si agenda un slot, validar que sea un horario real del taller.
  if (conSlot && !slotsDeFecha(d.fecha!).includes(d.hora!)) {
    return NextResponse.json(
      { error: "slot_invalido", mensaje: "Ese horario no está disponible." },
      { status: 422 },
    );
  }

  try {
    const sb = getSupabase();

    // Re-chequeo de disponibilidad en el servidor (anti-carrera complementario
    // al índice único): si el slot ya está tomado, 409.
    if (conSlot) {
      const { data: existentes, error: errBusca } = await sb
        .from("citas")
        .select("id")
        .eq("fecha", d.fecha!)
        .eq("hora", d.hora!)
        .neq("estado", "cancelada")
        .limit(1);
      if (errBusca) throw errBusca;
      if (existentes && existentes.length > 0) {
        return NextResponse.json(
          { error: "slot_ocupado", mensaje: "Ese horario se acaba de ocupar." },
          { status: 409 },
        );
      }
    }

    // Lead espejo (para la bandeja de leads). No bloquea la cita si falla.
    let leadId: string | null = null;
    try {
      const { data: lead } = await sb
        .from("leads")
        .insert({
          origen: "servicio",
          nombre: d.nombre,
          whatsapp: d.whatsapp,
          uso: d.tipo,
          score: "warm",
          payload: {
            tipo: d.tipo,
            marca: d.marca ?? null,
            modelo: d.modelo ?? null,
            fecha: d.fecha ?? null,
            hora: d.hora ?? null,
          },
          atendido: false,
        })
        .select("id")
        .single();
      leadId = (lead?.id as string) ?? null;
    } catch (e) {
      console.error("[POST /api/citas] lead espejo", e);
    }

    const { data: cita, error } = await sb
      .from("citas")
      .insert({
        tipo: d.tipo,
        nombre: d.nombre,
        whatsapp: d.whatsapp,
        email: d.email || null,
        marca: d.marca ?? null,
        modelo: d.modelo ?? null,
        descripcion: d.descripcion ?? null,
        precio_estimado: d.precioEstimado ?? null,
        fecha: d.fecha ?? null,
        hora: d.hora ?? null,
        estado: "pendiente",
        lead_id: leadId,
        atendido: false,
      })
      .select("id")
      .single();

    if (error) {
      // 23505 = violación de índice único (slot tomado por carrera).
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "slot_ocupado", mensaje: "Ese horario se acaba de ocupar." },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json(
      { ok: true, citaId: cita?.id ?? null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/citas]", err);
    return NextResponse.json(
      { error: "Error al registrar la cita" },
      { status: 500 },
    );
  }
}

/** GET → listar citas (solo admin). */
export async function GET(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const estado = req.nextUrl.searchParams.get("estado");
  const tipo = req.nextUrl.searchParams.get("tipo");

  try {
    const sb = getSupabase();
    let query = sb
      .from("citas")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(300);
    if (estado) query = query.eq("estado", estado);
    if (tipo) query = query.eq("tipo", tipo);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ citas: (data ?? []).map(filaACita) });
  } catch (err) {
    console.error("[GET /api/citas]", err);
    return NextResponse.json(
      { error: "Error al obtener las citas" },
      { status: 500 },
    );
  }
}

/** PATCH ?id= → cambiar estado y/o marcar atendida (solo admin). */
export async function PATCH(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  let body: { estado?: string; atendido?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* body opcional */
  }

  const cambios: Record<string, unknown> = {};
  if (body.estado && ["pendiente", "confirmada", "cancelada", "completada"].includes(body.estado)) {
    cambios.estado = body.estado;
  }
  if (typeof body.atendido === "boolean") cambios.atendido = body.atendido;
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from("citas").update(cambios).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/citas]", err);
    return NextResponse.json(
      { error: "Error al actualizar la cita" },
      { status: 500 },
    );
  }
}
