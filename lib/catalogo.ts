// Catálogo REAL de Red Motos — datos scrapeados de redmotos.cl (2026-06-09).
// 17 modelos con precios reales publicados. Los precios con bono traen
// precioLista (tachado) + precioBono (final). NO inventar cifras: los modelos
// que faltan del stock se agregan aquí cuando el cliente entregue sus precios.

import type { Moto, Marca } from "./tipos";

export const CATALOGO: Moto[] = [
  // ── ROYAL ENFIELD ────────────────────────────────────────────────────
  {
    id: "re-hunter-350",
    marca: "Royal Enfield",
    modelo: "Hunter 350",
    segmento: "Urbana",
    cc: 350,
    precioLista: 3_499_900,
    precioBono: null,
    img: "/motos/Hunter350.png",
    usos: ["Ciudad", "Placer"],
    aptaPrincipiante: true,
  },
  {
    id: "re-super-meteor-650-astral",
    marca: "Royal Enfield",
    modelo: "Super Meteor 650 Astral",
    segmento: "Cruiser",
    cc: 650,
    precioLista: 6_799_990,
    precioBono: null,
    img: "/motos/ASTRALBLUE.png",
    usos: ["Ruta", "Placer"],
    aptaPrincipiante: false,
  },
  {
    id: "re-super-meteor-650-interestellar",
    marca: "Royal Enfield",
    modelo: "Super Meteor 650 Interestellar",
    segmento: "Cruiser",
    cc: 650,
    precioLista: 6_899_900,
    precioBono: null,
    img: "/motos/INTERESTELLARGREEN.png",
    usos: ["Ruta", "Placer"],
    aptaPrincipiante: false,
  },
  {
    id: "re-super-meteor-650-celestial",
    marca: "Royal Enfield",
    modelo: "Super Meteor 650 Celestial",
    segmento: "Cruiser",
    cc: 650,
    precioLista: 6_999_900,
    precioBono: null,
    img: "/motos/CELESTIALRED.png",
    usos: ["Ruta", "Placer"],
    aptaPrincipiante: false,
  },
  {
    id: "re-scram-411",
    marca: "Royal Enfield",
    modelo: "Scram 411",
    segmento: "Scrambler",
    cc: 411,
    precioLista: 4_599_900,
    precioBono: 4_299_900,
    img: "/motos/SCRAM.411.png",
    usos: ["Ciudad", "Off-road", "Placer"],
    aptaPrincipiante: true,
  },
  {
    id: "re-shotgun-650",
    marca: "Royal Enfield",
    modelo: "Shotgun 650",
    segmento: "Custom",
    cc: 650,
    precioLista: 6_599_990,
    precioBono: null,
    img: "/motos/SHOTGUN650.png",
    usos: ["Ciudad", "Placer"],
    aptaPrincipiante: false,
  },

  // ── SUZUKI ───────────────────────────────────────────────────────────
  {
    id: "sz-gixxer-150-fi",
    marca: "Suzuki",
    modelo: "Gixxer 150 FI",
    segmento: "Naked",
    cc: 150,
    precioLista: 2_799_990,
    precioBono: null,
    img: "/motos/FI150A.png",
    usos: ["Ciudad", "Trabajo"],
    aptaPrincipiante: true,
  },
  {
    id: "sz-gixxer-150-di",
    marca: "Suzuki",
    modelo: "Gixxer 150 DI",
    segmento: "Naked",
    cc: 150,
    precioLista: 2_499_990,
    precioBono: null,
    img: "/motos/DI150.png",
    usos: ["Ciudad", "Trabajo"],
    aptaPrincipiante: true,
  },
  {
    id: "sz-gixxer-250-di",
    marca: "Suzuki",
    modelo: "Gixxer 250 DI",
    segmento: "Deportiva",
    cc: 250,
    precioLista: 3_749_900,
    precioBono: null,
    img: "/motos/DI250.png",
    usos: ["Ciudad", "Placer"],
    aptaPrincipiante: true,
  },
  {
    id: "sz-vstrom-250",
    marca: "Suzuki",
    modelo: "V-Strom 250",
    segmento: "Adventure",
    cc: 250,
    precioLista: 4_449_990,
    precioBono: null,
    img: "/motos/VSTROM250.png",
    usos: ["Ruta", "Ciudad", "Placer"],
    aptaPrincipiante: true,
  },
  {
    id: "sz-gsx-r-1000r",
    marca: "Suzuki",
    modelo: "GSX-R 1000R",
    segmento: "Deportiva",
    cc: 1000,
    precioLista: 19_999_990,
    precioBono: null,
    img: "/motos/GSX-R1000R.png",
    usos: ["Placer", "Ruta"],
    aptaPrincipiante: false,
  },

  // ── KYMCO ────────────────────────────────────────────────────────────
  {
    id: "ky-xtown-300",
    marca: "Kymco",
    modelo: "X-Town 300",
    segmento: "Scooter",
    cc: 300,
    precioLista: 4_599_990,
    precioBono: 3_999_990,
    img: "/motos/xtown300.png",
    usos: ["Ciudad", "Trabajo", "Ruta"],
    aptaPrincipiante: true,
  },

  // ── KEEWAY ───────────────────────────────────────────────────────────
  {
    id: "kw-superlight-200",
    marca: "Keeway",
    modelo: "Superlight 200",
    segmento: "Custom",
    cc: 200,
    precioLista: 2_299_000,
    precioBono: 1_999_900,
    img: "/motos/superlight200.png",
    usos: ["Ciudad", "Placer"],
    aptaPrincipiante: true,
  },

  // ── ZONTES ───────────────────────────────────────────────────────────
  {
    id: "zt-zt350-t2",
    marca: "Zontes",
    modelo: "ZT350-T2",
    segmento: "Adventure",
    cc: 350,
    precioLista: 4_390_000,
    precioBono: null,
    img: "/motos/T2.350.png",
    usos: ["Ruta", "Ciudad", "Placer"],
    aptaPrincipiante: false,
  },

  // ── VOGE ─────────────────────────────────────────────────────────────
  {
    id: "vg-525-dsx-m",
    marca: "Voge",
    modelo: "525 DSX M",
    segmento: "Adventure",
    cc: 525,
    precioLista: 6_799_000,
    precioBono: null,
    img: "/motos/525DSXM.png",
    usos: ["Ruta", "Off-road", "Placer"],
    aptaPrincipiante: false,
  },
  {
    id: "vg-300-rally",
    marca: "Voge",
    modelo: "300 Rally",
    segmento: "Off-road",
    cc: 300,
    precioLista: 3_299_000,
    precioBono: null,
    img: "/motos/rally.png",
    usos: ["Off-road", "Ciudad"],
    aptaPrincipiante: true,
  },

  // ── CYCLONE ──────────────────────────────────────────────────────────
  {
    id: "cy-ra2",
    marca: "Cyclone",
    modelo: "RA2",
    segmento: "Naked",
    cc: 250,
    precioLista: 2_899_900,
    precioBono: 2_699_900,
    img: "/motos/RA2.png",
    usos: ["Ciudad", "Trabajo"],
    aptaPrincipiante: true,
  },
];

/** Marcas presentes en el catálogo, en orden de jerarquía comercial. */
export const MARCAS_CATALOGO: Marca[] = [
  "Royal Enfield",
  "Suzuki",
  "Kymco",
  "Voge",
  "Zontes",
  "Keeway",
  "Cyclone",
];

/** Las 8 marcas distribuidas oficialmente (para el marquee de logos). */
export const MARCAS_OFICIALES = [
  { nombre: "Royal Enfield", logo: "/logos/logo-royal-enfield.png", insignia: true },
  { nombre: "Suzuki", logo: "/logos/logo-suzuki.png", insignia: true },
  { nombre: "Benelli", logo: "/logos/logo-benelli.png", insignia: false },
  { nombre: "Kymco", logo: "/logos/logo-kymco.png", insignia: false },
  { nombre: "Keeway", logo: "/logos/logo-keeway.png", insignia: false },
  { nombre: "Haojue", logo: "/logos/logo-haojue.png", insignia: false },
  { nombre: "Euromot", logo: "/logos/logo-euromot.png", insignia: false },
  { nombre: "Zongshen", logo: "/logos/logo-zongshen.png", insignia: false },
] as const;

export const MOTOS_ROYAL_ENFIELD = CATALOGO.filter(
  (m) => m.marca === "Royal Enfield",
);
export const MOTOS_SUZUKI = CATALOGO.filter((m) => m.marca === "Suzuki");

/** Precio vigente de una moto (bono si existe, lista si no). */
export function precioVigente(moto: Moto): number {
  return moto.precioBono ?? moto.precioLista;
}
