import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import type { Moto, Uso } from "@/lib/tipos";

const USOS_VALIDOS = ["Ciudad", "Ruta", "Off-road", "Trabajo", "Placer"] as const;

const esquemaMoto = z.object({
  id: z.string().optional(),
  marca: z.enum([
    "Royal Enfield",
    "Suzuki",
    "Kymco",
    "Zonsen",
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
    "Touring",
    "Motocross",
    "ATV",
    "UTV",
  ]),
  modelo: z.string().min(2, "El modelo necesita al menos 2 caracteres"),
  cc: z.coerce.number().int().positive().optional(),
  precioLista: z.coerce.number().int().positive("El precio debe ser positivo"),
  precioBono: z.coerce.number().int().nonnegative().nullable().optional(),
  bonoVence: z.string().nullable().optional(),
  imagenUrl: z.string().min(1, "Falta la imagen").optional().or(z.literal("")),
  usos: z.array(z.enum(USOS_VALIDOS)).optional(),
  aptaPrincipiante: z.boolean().optional(),
  destacado: z.boolean().optional(),
  orden: z.coerce.number().int().nonnegative().optional(),
});

function requiereSesion(): NextResponse | null {
  const valor = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(valor)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

function filaAMoto(fila: Record<string, unknown>): Moto {
  return {
    id: fila.id as string,
    marca: fila.marca as Moto["marca"],
    modelo: fila.modelo as string,
    segmento: fila.segmento as Moto["segmento"],
    cc: fila.cc as number,
    precioLista: fila.precio_lista as number,
    precioBono: (fila.precio_bono as number | null) ?? null,
    bonoVence: (fila.bono_vence as string | null) ?? null,
    img: fila.img as string,
    usos: (fila.usos as Uso[]) ?? [],
    aptaPrincipiante: Boolean(fila.apta_principiante),
    destacado: Boolean(fila.destacado),
    orden: (fila.orden as number) ?? 0,
  };
}

/** GET → catálogo activo ordenado. Público. */
export async function GET() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("motos")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) throw error;
    const motos = (data ?? []).map(filaAMoto);
    return NextResponse.json({ motos });
  } catch (err) {
    console.error("[GET /api/motos]", err);
    return NextResponse.json(
      { error: "Error al obtener el catálogo" },
      { status: 500 },
    );
  }
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
  const ccDetectado = d.cc ?? Number(d.modelo.match(/(\d{3,4})/)?.[1] ?? 0);
  const id = `admin-${Date.now()}`;

  try {
    const sb = getSupabase();

    const { data: maxOrden } = await sb
      .from("motos")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1)
      .single();
    const siguienteOrden = ((maxOrden?.orden as number) ?? -1) + 1;

    const { data, error } = await sb
      .from("motos")
      .insert({
        id,
        marca: d.marca,
        modelo: d.modelo,
        segmento: d.segmento,
        cc: ccDetectado,
        precio_lista: d.precioLista,
        precio_bono: d.precioBono ?? null,
        bono_vence: d.bonoVence ?? null,
        img: d.imagenUrl || "/logos/logo-royal-enfield.png",
        usos: d.usos ?? ["Ciudad"],
        apta_principiante: d.aptaPrincipiante ?? ccDetectado <= 400,
        destacado: d.destacado ?? false,
        orden: d.orden ?? siguienteOrden,
        activo: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/catalogo");

    return NextResponse.json({ ok: true, moto: filaAMoto(data as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/motos]", err);
    return NextResponse.json({ error: "Error al guardar la moto" }, { status: 500 });
  }
}

/** PUT → editar moto existente. */
export async function PUT(req: NextRequest) {
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
  if (!d.id) {
    return NextResponse.json({ error: "Falta el campo id" }, { status: 400 });
  }

  const ccDetectado = d.cc ?? Number(d.modelo.match(/(\d{3,4})/)?.[1] ?? 0);

  const actualizacion: Record<string, unknown> = {
    marca: d.marca,
    modelo: d.modelo,
    segmento: d.segmento,
    cc: ccDetectado,
    precio_lista: d.precioLista,
    precio_bono: d.precioBono ?? null,
    bono_vence: d.bonoVence ?? null,
  };
  if (d.imagenUrl !== undefined && d.imagenUrl !== "") actualizacion.img = d.imagenUrl;
  if (d.usos !== undefined) actualizacion.usos = d.usos;
  if (d.aptaPrincipiante !== undefined) actualizacion.apta_principiante = d.aptaPrincipiante;
  if (d.destacado !== undefined) actualizacion.destacado = d.destacado;
  if (d.orden !== undefined) actualizacion.orden = d.orden;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("motos")
      .update(actualizacion)
      .eq("id", d.id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/catalogo");

    return NextResponse.json({ ok: true, moto: filaAMoto(data as Record<string, unknown>) });
  } catch (err) {
    console.error("[PUT /api/motos]", err);
    return NextResponse.json({ error: "Error al actualizar la moto" }, { status: 500 });
  }
}

/** DELETE ?id= → baja lógica. */
export async function DELETE(req: NextRequest) {
  const bloqueo = requiereSesion();
  if (bloqueo) return bloqueo;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta el parámetro id" }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb
      .from("motos")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/catalogo");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/motos]", err);
    return NextResponse.json({ error: "Error al eliminar la moto" }, { status: 500 });
  }
}
