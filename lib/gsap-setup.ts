// Registra plugins GSAP una única vez para toda la app.
// Importar desde aquí en lugar de importar gsap directo en cada componente.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

/** True cuando el usuario pidió reducir el movimiento (accesibilidad). */
export function prefiereMenosMovimiento(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll suave a un selector CSS o elemento con offset opcional. */
export function scrollSuave(target: string | HTMLElement, offsetY = 0) {
  gsap.to(window, {
    duration: 0.65,
    scrollTo: { y: target, offsetY },
    ease: "power2.inOut",
  });
}

export { gsap, ScrollTrigger };
