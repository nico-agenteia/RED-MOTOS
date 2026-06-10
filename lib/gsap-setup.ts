// Registra ScrollTrigger una única vez para toda la app.
// Importar desde aquí en lugar de importar gsap directo en cada componente.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** True cuando el usuario pidió reducir el movimiento (accesibilidad). */
export function prefiereMenosMovimiento(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
