// Cliente server-side de Autofin "Araña 2.0" (QA).
// ⚠️ SOLO se importa desde rutas /api/autofin/*. Los tokens viven en variables
// de entorno SIN prefijo NEXT_PUBLIC: el navegador jamás los ve. Toda llamada a
// Autofin es server-to-server (esto además resuelve CORS por diseño).
//
// Fase 0: solo CONFIGURACION-SPIDER (GET). El armado de la cuota (CUOTA-TRINIDAD)
// llega en la Fase 1.

const BASE_URL =
  process.env.AUTOFIN_BASE_URL ?? "https://fabdigital-qa.autofin.cl/autofin/api";

function requireEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

/**
 * Respuesta de CONFIGURACION-SPIDER. Verificado contra QA: viene envuelta en
 * `{ success, return, body }` y la config útil (SEGUROS, SEGUROSMOTOS,
 * VEHICULOS.MOTO, CONFIGURACION, ...) vive dentro de `body`. Tipamos laxo a
 * propósito: la forma fina se fija en la Fase 1, al consumir los códigos
 * concretos (productos, plazos, Dealer/Sucursal) para armar la cuota.
 */
export interface ConfigSpiderRespuesta {
  success?: boolean;
  return?: { code?: string; message?: string };
  body?: Record<string, unknown>;
  [clave: string]: unknown;
}

/**
 * GET CONFIGURACION-SPIDER → config del negocio (productos, plazos, seguros y
 * códigos Dealer/Sucursal que alimentan a los demás endpoints). Cacheada: la
 * config no cambia seguido (revalida cada hora).
 *
 * @param codSpider sucursal Araña; por defecto AUTOFIN_COD_SPIDER. Se puede
 *   pasar explícito para probar otra sucursal en QA (autos vs. motos).
 */
export async function obtenerConfigSpider(
  codSpider?: string,
): Promise<ConfigSpiderRespuesta> {
  const cod = codSpider || requireEnv("AUTOFIN_COD_SPIDER");
  // El token se guarda CRUDO en el .env y se codifica aquí. Verificado contra
  // QA: la forma "Postman" (parcialmente codificada) del manual da HTTP 400; el
  // servidor exige el token totalmente percent-encoded (encodeURIComponent).
  const token = encodeURIComponent(requireEnv("AUTOFIN_TOKEN_CONFIG"));
  const url = `${BASE_URL}/configuracion-spider/v1/${encodeURIComponent(
    cod,
  )}?token=${token}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(
      `CONFIGURACION-SPIDER respondió ${res.status}: ${detalle.slice(0, 300)}`,
    );
  }
  return (await res.json()) as ConfigSpiderRespuesta;
}
