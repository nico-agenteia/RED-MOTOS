// Registro de qué motos tienen secuencia 360° generada. Mientras una moto no
// esté aquí (o tenga 0), el Viewer360 muestra la foto estática (Moto.img).
// Al agregar frames a /public/360/<slug>/, registrar aquí su cantidad.
// <slug> = el id del catálogo (lib/catalogo.ts), p.ej. "sz-gsx-r-1000r".
export const FRAMES_360: Record<string, number> = {
  "sz-gsx-r-1000r": 24,
  "re-super-meteor-650-celestial": 24,
};

export type Frames360 = {
  slug: string;
  /** Cantidad de frames disponibles. 0 = no hay → usar fallback estático. */
  count: number;
  framePath: (n: number) => string;
  shadowPath: string;
};

/** Datos de la secuencia 360 de una moto, según el manifest FRAMES_360. */
export function frames360(slug: string): Frames360 {
  const count = FRAMES_360[slug] ?? 0;
  return {
    slug,
    count,
    framePath: (n) => `/360/${slug}/frame_${String(n).padStart(3, "0")}.webp`,
    shadowPath: `/360/${slug}/shadow.png`,
  };
}
