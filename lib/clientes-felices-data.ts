import type { ClienteFeliz } from "./tipos";

// Fallback: las 20 fotos co-brandeadas estáticas históricas. Se usan si Supabase
// no está configurado o aún no hay clientes cargados desde el panel.
const TESTIMONIOS_ESTATICOS: ClienteFeliz[] = Array.from({ length: 20 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `static-${n}`,
    imgUrl: `/testimonios/testimonio-${n}.jpg`,
    nombre: null,
    marca: null,
    modelo: null,
    orden: i,
    activo: true,
  };
});

function filaACliente(f: Record<string, unknown>): ClienteFeliz {
  return {
    id: f.id as string,
    imgUrl: f.img_url as string,
    nombre: (f.nombre as string | null) ?? null,
    marca: (f.marca as string | null) ?? null,
    modelo: (f.modelo as string | null) ?? null,
    orden: (f.orden as number) ?? 0,
    activo: Boolean(f.activo),
  };
}

/**
 * Clientes felices activos desde Supabase, con fallback a las fotos estáticas.
 * Solo para Server Components / API routes.
 */
export async function getClientesFelices(): Promise<ClienteFeliz[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return TESTIMONIOS_ESTATICOS;

  try {
    const { getSupabase } = await import("./supabase");
    const sb = getSupabase();
    const { data, error } = await sb
      .from("clientes_felices")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("creado_en", { ascending: false });

    if (error || !data?.length) return TESTIMONIOS_ESTATICOS;
    return data.map(filaACliente);
  } catch {
    return TESTIMONIOS_ESTATICOS;
  }
}
