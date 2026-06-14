"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useReveal } from "@/lib/useReveal";

// Las 20 tarjetas co-brandeadas reales rescatadas de redmotos.cl.
const TESTIMONIOS = Array.from({ length: 20 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    src: `/testimonios/testimonio-${n}.jpg`,
    alt: `Cliente real de Red Motos con su moto nueva — entrega ${n}`,
  };
});

const AUTOPLAY_MS = 4000;

export default function Clientes() {
  const pistaRef = useRef<HTMLDivElement>(null);
  const headerRef = useReveal<HTMLDivElement>(".cliente-reveal", {
    y: 30,
    stagger: 0.1,
    start: "top 80%",
  });
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Drag con mouse (en touch el scroll-snap nativo ya funciona).
  const drag = useRef({ activo: false, inicioX: 0, inicioScroll: 0 });

  function irA(indice: number) {
    const pista = pistaRef.current;
    if (!pista) return;
    const tarjeta = pista.children[indice] as HTMLElement | undefined;
    if (tarjeta) {
      pista.scrollTo({ left: tarjeta.offsetLeft - 16, behavior: "smooth" });
    }
  }

  // Auto-play cada 4s, pausa en hover/drag.
  useEffect(() => {
    if (pausado) return;
    const reducirMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducirMotion) return;

    const id = setInterval(() => {
      const siguiente = (activo + 1) % TESTIMONIOS.length;
      irA(siguiente);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [activo, pausado]);

  // Detectar tarjeta activa según posición de scroll.
  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    let raf = 0;
    const alScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const hijos = Array.from(pista.children) as HTMLElement[];
        const centro = pista.scrollLeft + pista.clientWidth / 2;
        let mejor = 0;
        let mejorDist = Infinity;
        hijos.forEach((h, i) => {
          const d = Math.abs(h.offsetLeft + h.clientWidth / 2 - centro);
          if (d < mejorDist) {
            mejorDist = d;
            mejor = i;
          }
        });
        setActivo(mejor);
      });
    };
    pista.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      pista.removeEventListener("scroll", alScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section aria-label="Nuestros clientes" className="bg-black py-24">
      <div ref={headerRef} className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="cliente-reveal label-mono mb-3">Lo que dicen de nosotros</p>
        <h2
          className="cliente-reveal headline-display text-white"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Nuestros clientes
        </h2>
        <p className="cliente-reveal mt-4 max-w-xl text-lg text-muted">
          Gente real retirando su moto real, en tienda. Sin actores, sin
          fotos de banco de imágenes.
        </p>
      </div>

      {/* Carrusel scroll-snap + drag, sin librería */}
      <div
        ref={pistaRef}
        className="carrusel-snap mt-12 flex cursor-grab gap-6 overflow-x-auto px-4 pb-4 active:cursor-grabbing md:px-8"
        role="region"
        aria-label="Carrusel de entregas a clientes"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => {
          setPausado(false);
          drag.current.activo = false;
        }}
        onMouseDown={(e) => {
          const pista = pistaRef.current;
          if (!pista) return;
          drag.current = {
            activo: true,
            inicioX: e.pageX,
            inicioScroll: pista.scrollLeft,
          };
        }}
        onMouseMove={(e) => {
          const pista = pistaRef.current;
          if (!pista || !drag.current.activo) return;
          e.preventDefault();
          pista.scrollLeft =
            drag.current.inicioScroll - (e.pageX - drag.current.inicioX);
        }}
        onMouseUp={() => {
          drag.current.activo = false;
        }}
      >
        {TESTIMONIOS.map((t, i) => (
          <motion.figure
            key={t.src}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              delay: (i % 4) * 0.08,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-[300px] shrink-0 select-none overflow-hidden rounded-lg shadow-[0_24px_48px_rgba(0,0,0,0.5)] md:w-[380px]"
          >
            <img
              src={t.src}
              alt={t.alt}
              width={380}
              height={480}
              loading="lazy"
              draggable={false}
              className="h-[320px] w-full rounded-lg object-contain bg-zinc-900 md:h-[400px]"
            />
          </motion.figure>
        ))}
      </div>

      {/* Indicadores */}
      <div
        className="mt-6 flex flex-wrap justify-center gap-2 px-4"
        role="tablist"
        aria-label="Posición del carrusel"
      >
        {TESTIMONIOS.map((t, i) => (
          <button
            key={t.src}
            type="button"
            role="tab"
            aria-selected={activo === i}
            aria-label={`Ir a la entrega ${i + 1}`}
            onClick={() => irA(i)}
            className="flex h-6 w-6 items-center justify-center"
          >
            <span
              className={`block h-2 w-2 rounded-full transition-all duration-300 ${
                activo === i ? "scale-125 bg-red-500" : "bg-surface-2"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
