// Cliente server-side de Autofin "Araña 2.0" (QA).
// ⚠️ SOLO se importa desde rutas /api/autofin/*. Los tokens viven en variables
// de entorno SIN prefijo NEXT_PUBLIC: el navegador jamás los ve. Toda llamada a
// Autofin es server-to-server (esto además resuelve CORS por diseño).
//
// Fase 0: CONFIGURACION-SPIDER (GET).
// Fase 1: CUOTA-TRINIDAD (POST) → cuota real + CAE + costo total.

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
  // El token se guarda YA percent-encoded en el .env y se usa tal cual.
  // Por qué encoded y no crudo: (1) el server exige el token totalmente
  // percent-encoded —la forma "Postman" del manual da HTTP 400—; (2) el token
  // crudo trae secuencias `${...}` que el dotenv de Next corrompe al parsear el
  // .env (las trata como variables y las borra), aun entre comillas.
  const token = requireEnv("AUTOFIN_TOKEN_CONFIG");
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

// ─── Fase 1 — Cuota real (CUOTA-TRINIDAD) ────────────────────────────────────

/**
 * Vehículo de homologación del simulador genérico (no está atado a una moto
 * puntual). Verificado en QA: el valor cuota NO depende del modelo —todos los
 * Royal Enfield registrados dan la misma cuota para igual precio/pie/plazo—,
 * solo se exige que marca y modelo homologuen en Autofin. La cuota depende del
 * producto financiero + precio + pie + plazo + seguros.
 */
const MOTO_HOMOLOGACION = { marca: "Royal Enfield", modelo: "Meteor 350" } as const;

/** Seguros tal como los espera el body de CUOTA-TRINIDAD (8 llaves canónicas). */
export interface SegurosMoto {
  Desgravamen: boolean;
  Cesantia: boolean;
  AutoProtegido: boolean;
  PerdidaTotal: boolean;
  ReparacionesMenores: boolean;
  RDH: boolean;
  GPS: boolean;
  GarantiaMecanica: boolean;
}

/** Rangos y plazos que el simulador muestra al usuario (derivados de la config). */
export interface OpcionesMoto {
  plazos: number[];
  pieMinPct: number;
  pieMaxPct: number;
  precioMin: number;
  precioMax: number;
}

/** Códigos server-side para armar el body de cuota (nunca van al browser). */
interface CodigosMoto extends OpcionesMoto {
  producto: number;
  tipoCredito: number;
  dealer: number;
  sucursal: number;
  seguros: SegurosMoto;
}

function aNumero(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

function mapearSeguros(s: Record<string, unknown> | undefined): SegurosMoto {
  const v = s ?? {};
  return {
    Desgravamen: !!v.Desgravamen,
    Cesantia: !!v.Cesantia,
    AutoProtegido: !!v.AutoProtegido,
    PerdidaTotal: !!v.PerdidaTotal,
    ReparacionesMenores: !!v.ReparacionesMenores,
    RDH: !!v.RDH,
    GPS: !!v.GPS,
    GarantiaMecanica: !!v.GarantiaMecanica,
  };
}

/**
 * Extrae de la config el producto de motos (CONVENCIONAL → MOTOPLAN) con sus
 * códigos, rangos y plazos. Lanza si la estructura no trae un producto usable.
 */
function extraerMotoDeConfig(config: ConfigSpiderRespuesta): CodigosMoto {
  // La estructura de Autofin es JSON de proveedor, profundamente anidado: se
  // navega con acceso laxo y se valida lo crítico antes de devolver.
  const body = (config.body ?? {}) as Record<string, any>;
  const negocio = body?.VEHICULOS?.MOTO?.NEGOCIOS?.[0];
  const productos: any[] = negocio?.PRODUCTOS ?? [];
  const producto =
    productos.find((p) => p?.EsDefault && p?.Enabled) ??
    productos.find((p) => p?.Enabled) ??
    productos[0];

  const cfg = body?.CONFIGURACION ?? {};
  const codProducto = aNumero(producto?.CodProducto);
  const codNegocio = aNumero(negocio?.CodTipoNegocio);
  const dealer = aNumero(cfg?.CodigoCES);
  const sucursal = aNumero(cfg?.CodigoSucursal);

  if (
    codProducto === undefined ||
    codNegocio === undefined ||
    dealer === undefined ||
    sucursal === undefined
  ) {
    throw new Error("Config de Autofin sin producto de motos utilizable");
  }

  const plazos: number[] = (producto?.CUOTAS ?? [])
    .filter((c: any) => c?.PlazoVigencia)
    .map((c: any) => aNumero(c?.Plazo))
    .filter((p: number | undefined): p is number => p !== undefined);

  return {
    producto: codProducto,
    tipoCredito: codNegocio,
    dealer,
    sucursal,
    seguros: mapearSeguros(body?.SEGUROSMOTOS as Record<string, unknown>),
    plazos,
    pieMinPct: aNumero(producto?.PIE?.Minimo) ?? 30,
    pieMaxPct: aNumero(producto?.PIE?.Maximo) ?? 90,
    precioMin: aNumero(producto?.PRECIOVENTA?.Minimo) ?? 400000,
    precioMax: aNumero(producto?.PRECIOVENTA?.Maximo) ?? 30000000,
  };
}

/** Opciones públicas del simulador de motos (plazos + rangos pie/precio). */
export async function obtenerOpcionesMoto(
  codSpider?: string,
): Promise<OpcionesMoto> {
  const { plazos, pieMinPct, pieMaxPct, precioMin, precioMax } =
    extraerMotoDeConfig(await obtenerConfigSpider(codSpider));
  return { plazos, pieMinPct, pieMaxPct, precioMin, precioMax };
}

export interface EntradaCuota {
  precio: number;
  montoPie: number;
  plazo: number;
}

export interface ResultadoCuota {
  valorCuota: number;
  cae: number;
  totalCredito: number;
}

/**
 * Cuota real vía CUOTA-TRINIDAD usando los códigos de la config. Lanza si
 * Autofin responde error (pie < mínimo, plazo no disponible, etc.) o si la
 * llamada HTTP falla → la ruta lo traduce y el simulador cae al cálculo
 * referencial local.
 */
export async function obtenerCuotaMoto(
  entrada: EntradaCuota,
  codSpider?: string,
): Promise<ResultadoCuota> {
  const c = extraerMotoDeConfig(await obtenerConfigSpider(codSpider));
  const token = requireEnv("AUTOFIN_TOKEN_CUOTA"); // ya percent-encoded (ver obtenerConfigSpider)
  const url = `${BASE_URL}/cuota-trinidad/v1?token=${token}`;

  const cuerpo = {
    ConsultaCuotaReqRest: {
      Precio: entrada.precio,
      MontoPie: entrada.montoPie,
      Plazo: entrada.plazo,
      Producto: c.producto,
      TipoCredito: c.tipoCredito,
      Seguros: c.seguros,
      MontoVFMG: 0, // motos = Convencional, sin Valor Futuro Mínimo Garantizado
      Marca: MOTO_HOMOLOGACION.marca,
      Modelo: MOTO_HOMOLOGACION.modelo,
      Anno: new Date().getFullYear(),
      Dealer: c.dealer,
      Sucursal: c.sucursal,
      EstadoVehiculo: "N", // MOTOPLAN NUEVOS
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`CUOTA-TRINIDAD respondió ${res.status}`);
  }

  const json = (await res.json()) as {
    body?: {
      CuotaTrinidad?: {
        Error?: boolean;
        ValorCuota?: string;
        ValorCae?: number;
        TotalCredito?: string;
        Mensaje?: string;
      };
    };
  };
  const ct = json.body?.CuotaTrinidad;
  if (!ct || ct.Error) {
    throw new Error(ct?.Mensaje?.trim() || "Autofin no entregó la cuota");
  }

  return {
    valorCuota: aNumero(ct.ValorCuota) ?? 0,
    cae: aNumero(ct.ValorCae) ?? 0,
    totalCredito: aNumero(ct.TotalCredito) ?? 0,
  };
}
