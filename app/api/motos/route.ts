import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { CATALOGO } from "@/lib/catalogo";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import type { Moto } from "@/lib/tipos";

// TODO: conectar a Supabase (tabla `motos`). Por ahora el stock agregado
// desde el admin vive en memoria del proceso: sirve para la demo local,
// pero en serverless se reinicia con cada cold start.
const stockAgregado: Moto[] = [];
const idsEliminados = new Set<string>();

const esquemaMoto = z.object({
  marca: z.enum([
    "Royal Enfield",
    "Suzuki",
    "Kymco",
    "Keeway",
    "Zontes",
    "Voge",
    "Cyclone",
  ]),
  segmento: z.enum([
    "Urbana",
    "Deportiva",
    "Adventure",
    "Off-road",
    "Cruiser",
    "Scrambler",
    "Custom",
    "Scooter",
    "Naked",
  ]),
  modelo: z.string().min(2, "El modelo necesita al menos 2 caracteres"),
  anio: z.coerce.number().int().min(2015).max(2030).optional(),
  precioLista: z.coerce.number().int().positive("El precio debe ser positivo"),
  bono: z.coerce.number().int().nonnegative().optional(),
  imagenUrl: z.string().min(1, "Falta la imagen").optional(),
});

function requiereSesion(): NextResponse | null {
  const valor = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(valor)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/** GET → catálogo completo (base + agregadas − eliminadas). Público. */
export async function GET() {
  const motos = [...CATALOGO, ...stockAgregado].filter(
    (m) => !idsEliminados.has(m.id),
  );
  return NextResponse.json({ motos });
}

/** POST → alta de moto desde el panel admin. */
export async function POST(req: NextRequest) {
  const bloqueo = requiereSesion();
  if (bloqueo) return bloqueo;

  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const resultado = esquemaMoto.safeParse(datos);
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Validación falló", detalles: resultado.error.flatten() },
      { status: 422 },
    );
  }

  const d = resultado.data;
  const ccDetectado = Number(d.modelo.match(/(\d{3,4})/)?.[1] ?? 0);
  const nueva: Moto = {
    id: `admin-${Date.now()}`,
    marca: d.marca,
    modelo: d.modelo,
    segmento: d.segmento,
    cc: ccDetectado,
    precioLista: d.precioLista,
    precioBono:
      d.bono && d.bono > 0 ? Math.max(d.precioLista - d.bono, 0) : null,
    img: d.imagenUrl ?? "/logos/logo-royal-enfield.png",
    usos: ["Ciudad"],
    aptaPrincipiante: ccDetectado <= 400,
  };
  stockAgregado.push(nueva);
  return NextResponse.json({ ok: true, moto: nueva }, { status: 201 });
}

/** DELETE ?id= → baja lógica de una moto. */
export async function DELETE(req: NextRequest) {
  const bloqueo = requiereSesion();
  if (bloqueo) return bloqueo;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta el parámetro id" }, { status: 400 });
  }
  idsEliminados.add(id);
  return NextResponse.json({ ok: true });
}
