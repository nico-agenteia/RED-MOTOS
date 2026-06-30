// Códigos del maestro Autofin para prellenar el iFrame de solicitud de Araña
// con la moto REAL que eligió el cliente (homologación de la inyección).
//
// Fuente: "Catálogo Marcas-Modelos Autofin Motos · junio 2026" (José Cumio).
// Copia versionada en docs/catalogo-autofin-motos-2026.xlsx.
//
//   brand = CodMarca · model = CodModelo
//
// ⚠️ La CUOTA no depende del modelo (ver MOTO_HOMOLOGACION en lib/autofin.ts):
// estos códigos son SOLO para que la inyección de solicitud homologue contra el
// modelo elegido. (~) marca un match aproximado al modelo base cuando Autofin no
// tiene esa variante de color/edición exacta — homologa igual; el detalle final
// lo ajusta la tienda.

import type { Marca, Moto } from "./tipos";

/** CodMarca de Autofin por marca de Red Motos. */
export const MARCA_AUTOFIN: Record<Marca, number> = {
  "Royal Enfield": 160,
  Suzuki: 52,
  Kymco: 159,
  Zonsen: 213,
  Cyclone: 212,
};

/** CodModelo de Autofin por id de moto del catálogo de Red Motos. */
export const MODELO_AUTOFIN: Record<string, number> = {
  // ── Royal Enfield (160) ──────────────────────────────────────────────
  "re-hunter-350": 10018, // HUNTER 350
  "re-classic-350": 10009, // CLASSIC 350
  "re-classic-350-goan": 10055, // GOAN CLASSIC 350
  "re-meteor-350-fireball": 10042, // METEOR 350 (FIREBALL)
  "re-meteor-350-stellar": 10043, // METEOR 350 (STELLAR)
  "re-meteor-350-sundowner": 10058, // METEOR 350 (SUNDOWNER ORANGE)
  "re-grr-450": 10039, // GRR 450
  "re-himalayan-452": 10030, // HIMALAYAN 452
  "re-himalayan-452-tubular": 10054, // HIMALAYAN 452 TUBULAR
  "re-himalayan-452-rally": 10059, // HIMALAYAN 452 (RALLY)
  "re-classic-650": 10057, // CLASSIC 650
  "re-classic-650-chrome": 10060, // CLASSIC 650 (CHROME)
  "re-shotgun-650": 10023, // SHOTGUN 650
  "re-bear-650": 10032, // BEAR 650
  "re-super-meteor-650-astral": 10045, // SUPER METEOR 650 (ASTRAL)
  "re-super-meteor-650-interestellar": 10047, // SUPER METEOR 650 (INTERESTELLAR)
  "re-super-meteor-650-celestial": 10046, // SUPER METEOR 650 (CELESTIAL)

  // ── Suzuki (52) ──────────────────────────────────────────────────────
  "sz-burgman-street-125": 10256, // BURGMAN STREET 125
  "sz-gsx-150-frf-gixxer": 10228, // GSX 150 FRF GIXXER
  "sz-gsx-150-rf-gixxer": 10229, // GSX 150 RF GIXXER
  "sz-gsx250fi-gixxer": 10230, // GSX250FI GIXXER
  "sz-gsx250di-gixxer": 10231, // GSX250DI GIXXER
  "sz-gsx-8s": 10261, // GSX-8S
  "sz-gsx-s1000": 10198, // GSX-S 1000
  "sz-gsx-r1000r": 10270, // GSX-R1000 R
  "sz-gsx1300ra-hayabusa": 184, // GSX1300RA (Hayabusa)
  "sz-vstrom-ds250-sx": 10234, // DS250 V STROM SX
  "sz-vstrom-dl650xa": 10235, // DL650XA V STROM
  "sz-vstrom-dl800-de": 10236, // DL-800 DE V STROM
  "sz-vstrom-dl1050-de": 10237, // DL-1050 DE V STROM
  "sz-dr125l": 10273, // DRZ 125L
  "sz-rmz250": 10210, // RMZ250
  "sz-rmz450": 10211, // RMZ450
  "sz-ltf-400-fsm3": 10267, // LT-F 400 FSM3
  "sz-lta-900xpm3": 10262, // LT-A 500 XPM3 (modelo real: LT-A 500XPM3)
  "sz-lta-750xpm3": 10265, // LT-A 750XPM3

  // ── Cyclone (212) ────────────────────────────────────────────────────
  "cy-ra2": 1, // RA2
  "cy-rx-401": 3, // RX-401
  "cy-rx-401-maletas": 5, // RX-401 con maletas
  "cy-rx1": 6, // RX1

  // ── Zonsen (213) ─────────────────────────────────────────────────────
  "zs-zii": 10, // ZII
  "zs-rx3": 5, // RX3

  // ── Kymco (159) ──────────────────────────────────────────────────────
  "ky-xtown-300": 10014, // X-TOWN 300
  "ky-mxu-150": 10002, // MXU 150
  "ky-mxu-250": 10003, // MXU 250
  "ky-mxu-300r": 10015, // MXU 300R
  "ky-uxv-450": 10012, // UXV 450
  "ky-uxv-700ia": 10009, // UXV700IA
};

export interface CodigosAutofin {
  brand: number;
  model: number;
}

/**
 * Códigos Autofin {brand, model} de una moto, o null si no está mapeada
 * (el simulador cae al código de homologación por defecto del server).
 */
export function codigosAutofin(
  moto: Pick<Moto, "id" | "marca">,
): CodigosAutofin | null {
  const model = MODELO_AUTOFIN[moto.id];
  const brand = MARCA_AUTOFIN[moto.marca];
  if (model === undefined || brand === undefined) return null;
  return { brand, model };
}
