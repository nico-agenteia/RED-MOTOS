import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import type { VentaPostventa } from "@/lib/tipos";

export const runtime = "nodejs";

const esquemaVenta = z.object({
  nombre: z.string().min(2).max(120),
  whatsapp: z.string().min(6).max(40),
  email: z.string().email().optional().or(z.literal("")),
  marca: z.string().max(80).optional(),
  modelo: z.string().max(120).optional(),
  patente: z.string().max(20).optional(),
  fechaCompra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vendedor: z.string().max(80).optional(),
  notas: z.string().max(1000).optional(),
});

function filaAVenta(f: Record<string, unknown>): VentaPostventa {
  return {
    id: f.id as string,
    nombre: f.nombre as string,
    whatsapp: f.whatsapp as string,
    email: (f.email as string | null) ?? null,
    marca: (f.marca as string | null) ?? null,
    modelo: (f.modelo as string | null) ?? null,
    patente: (f.patente as string | null) ?? null,
    fechaCompra: f.fecha_compra as string,
    vendedor: (f.vendedor as string | null) ?? null,
    notas: (f.notas as string | null) ?? null,
    hito1m: Boolean(f.hito_1m),
    hito4m: Boolean(f.hito_4m),
    hito8m: Boolean(f.hito_8m),
    hito12m: Boolean(f.hito_12m),
    creadoEn: f.creado_en as string,
  };
}

const COLUMNA_HITO: Record<string, string> = {
  "1m": "hito_1m",
  "4m": "hito_4m",
  "8m": "hito_8m",
  "12m": "hito_12m",
};

function autorizado(): boolean {
  return esSesionValida(cookies().get(COOKIE_SESION)?.value);
}

/** POST → registrar una venta 0 km (solo admin). */
export async function POST(req: NextRequest) {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = esquemaVenta.safeParse(datos);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación falló", detalles: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const d = parsed.data;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("ventas")
      .insert({
        nombre: d.nombre,
        whatsapp: d.whatsapp,
        email: d.email || null,
        marca: d.marca ?? null,
        modelo: d.modelo ?? null,
        patente: d.patente ?? null,
        fecha_compra: d.fechaCompra,
        vendedor: d.vendedor ?? null,
        notas: d.notas ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, ventaId: data?.id ?? null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/ventas]", err);
    return NextResponse.json({ error: "Error al registrar la venta" }, { status: 500 });
  }
}

/** GET → listar ventas (solo admin). */
export async function GET() {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("ventas")
      .select("*")
      .order("fecha_compra", { ascending: false })
      .limit(500);
    if (error) throw error;
    return NextResponse.json({ ventas: (data ?? []).map(filaAVenta) });
  } catch (err) {
    console.error("[GET /api/ventas]", err);
    return NextResponse.json({ error: "Error al obtener las ventas" }, { status: 500 });
  }
}

/** PATCH ?id= → marcar un hito como hecho/pendiente (solo admin). */
export async function PATCH(req: NextRequest) {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  let body: { hito?: string; hecho?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* body opcional */
  }

  const columna = body.hito ? COLUMNA_HITO[body.hito] : undefined;
  if (!columna || typeof body.hecho !== "boolean") {
    return NextResponse.json({ error: "Hito o valor inválido" }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb
      .from("ventas")
      .update({ [columna]: body.hecho })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/ventas]", err);
    return NextResponse.json({ error: "Error al actualizar la venta" }, { status: 500 });
  }
}
