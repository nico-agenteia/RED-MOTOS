// Fondos de marca para la generación de imágenes de catálogo (panel admin).
// Los colores son los YA establecidos en el sitio (ver TINTE_MARCA en
// components/Catalogo.tsx y las salas de marca): así la foto generada combina
// con la tarjeta y la sección de su marca.
//
// `swatch` se usa en el selector del panel; `prompt` es el fragmento en inglés
// que se inyecta al prompt de KIE para producir el fondo correcto.

import type { Marca } from "./tipos";

export interface FondoMarca {
  /** Color para el punto del selector en el panel admin. */
  swatch: string;
  /** Descripción del fondo en inglés para el prompt de generación. */
  prompt: string;
}

export const FONDOS_MARCA: Record<Marca, FondoMarca> = {
  "Royal Enfield": {
    swatch: "#C9A84C",
    prompt:
      "a warm dark heritage studio background, deep espresso-brown to charcoal gradient (#1A1208 to #0A0806), a subtle warm golden rim light (#C9A84C) outlining the bike, vintage premium showroom mood",
  },
  Suzuki: {
    swatch: "#3B6FD4",
    prompt:
      "a deep racing-blue studio background, near-black navy gradient (#00102E to #0B1A3A), a cool blue rim light (#3B6FD4) outlining the bike, sporty premium showroom mood",
  },
  Cyclone: {
    swatch: "#E0552B",
    prompt:
      "a dark warm studio background, deep maroon-to-black gradient (#1A0A07 to #0A0504), an orange-red rim light (#E0552B) outlining the bike, bold adventurous showroom mood",
  },
  Zonsen: {
    swatch: "#9B7BD4",
    prompt:
      "a dark studio background, deep violet-charcoal gradient (#14101F to #0A0810), a soft purple rim light (#9B7BD4) outlining the bike, modern minimal showroom mood",
  },
  Kymco: {
    swatch: "#3FB97E",
    prompt:
      "a dark studio background, deep teal-green-charcoal gradient (#0A1A12 to #060D0A), a green rim light (#3FB97E) outlining the bike, clean urban showroom mood",
  },
};

/** Orden de marcas para el selector del panel. */
export const MARCAS_FONDO = Object.keys(FONDOS_MARCA) as Marca[];
