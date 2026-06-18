import { CATALOGO } from "./catalogo";
import type { Moto, Uso } from "./tipos";

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
    sinStock: Boolean(fila.sin_stock),
  };
}

/**
 * Obtiene el catálogo activo desde Supabase.
 * En caso de error (Supabase no configurado, timeout, etc.) cae al array
 * estático de `lib/catalogo.ts` para que el sitio nunca quede sin datos.
 * Solo para uso en Server Components / API routes.
 */
export async function getMotos(): Promise<Moto[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return CATALOGO;
  }

  try {
    const { getSupabase } = await import("./supabase");
    const sb = getSupabase();
    const { data, error } = await sb
      .from("motos")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error || !data?.length) return CATALOGO;
    return data.map(filaAMoto);
  } catch {
    return CATALOGO;
  }
}

/** Solo las motos marcadas como destacado=true, para ShowcasePremium. */
export async function getMotosDestacadas(): Promise<Moto[]> {
  const motos = await getMotos();
  return motos.filter((m) => m.destacado);
}
