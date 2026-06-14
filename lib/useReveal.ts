"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-setup";
import { prefiereMenosMovimiento } from "@/lib/gsap-setup";

interface RevealOptions {
  /** Desplazamiento vertical inicial en px (default 40) */
  y?: number;
  /** Delay escalonado entre elementos en segundos (default 0.08) */
  stagger?: number;
  /** Punto de inicio del ScrollTrigger (default "top 82%") */
  start?: string;
  /** Si la animación ocurre solo una vez (default true) */
  once?: boolean;
  /** Duración en segundos (default 0.9) */
  duration?: number;
}

/**
 * Hook que aplica una animación de reveal (fade + slide up) a todos los
 * elementos que coincidan con `selector` dentro del contenedor retornado.
 * Respeta `prefers-reduced-motion` automáticamente.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  selector: string,
  options: RevealOptions = {},
) {
  const containerRef = useRef<T>(null);
  const {
    y = 40,
    stagger = 0.08,
    start = "top 82%",
    once = true,
    duration = 0.9,
  } = options;

  useEffect(() => {
    if (prefiereMenosMovimiento()) return;

    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>(
        selector,
        containerRef.current ?? undefined,
      );
      if (!elements.length) return;

      gsap.fromTo(
        elements,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          ease: "expo.out",
          stagger,
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            once,
          },
        },
      );
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [selector, y, stagger, start, once, duration]);

  return containerRef;
}
