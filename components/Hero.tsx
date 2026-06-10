"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { linkWhatsApp, MENSAJE_WSP_GENERICO, NEGOCIO } from "@/lib/config";
import Viewer360 from "./Viewer360";

/** Pide abrir el asistente del Recomendador IA (lo escucha RecomendadorIA). */
function abrirRecomendador() {
  window.dispatchEvent(new CustomEvent("rm:abrir-recomendador"));
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicadorVisible, setIndicadorVisible] = useState(true);
  const [reduce, setReduce] = useState(false);

  // Respetar prefers-reduced-motion (necesario para parallaxFondo).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Progreso de scroll dentro de la sección sticky.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) return;
        const { top, height } = section.getBoundingClientRect();
        const windowH = window.innerHeight;
        const denom = height - windowH || 1;
        const progress = Math.max(0, Math.min(1, -top / denom));
        setScrollProgress(progress);
        setIndicadorVisible(progress < 0.04);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const parallaxFondo = reduce ? 0 : scrollProgress * 48; // px

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Portada Red Motos"
      style={{ height: "300vh" }}
    >
      <div
        style={{ position: "sticky", top: 0, height: "100dvh" }}
        className="relative flex min-h-[560px] items-end overflow-hidden bg-black"
      >
        {/* FONDO con parallax sutil — LCP, prioridad alta */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ transform: `translateY(${parallaxFondo}px)`, willChange: "transform" }}
        >
          <img
            src="/slides/slide-1.jpg"
            alt=""
            width={1920}
            height={1080}
            // @ts-expect-error fetchpriority es atributo HTML válido aún no tipado en React 18
            fetchpriority="high"
            className="h-full w-full scale-110 object-cover"
          />
        </div>

        {/* MOTO — delegada a Viewer360 (360° real si hay frames, placeholder rotateY si no) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[3%] top-1/2 w-[62vw] max-w-[680px] -translate-y-1/2 md:right-[6%] md:w-[52vw]"
        >
          <Viewer360
            slug="sz-gsx-r-1000r"
            fallbackImg="/motos/GSX-R1000R.png"
            alt="Suzuki GSX-R 1000R"
            progreso={scrollProgress}
          />
        </div>

        {/* OVERLAYS */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent"
        />

        {/* TEXTO abajo-izquierda */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="label-mono mb-4"
          >
            {NEGOCIO.claim} · Punto oficial Royal Enfield
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="headline-display text-white"
            style={{ fontSize: "clamp(52px, 10vw, 104px)", lineHeight: 0.9 }}
          >
            Mueve
            <br />
            tu mundo.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <motion.button
              type="button"
              onClick={abrirRecomendador}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="inline-flex min-h-[48px] items-center rounded-md bg-red-500 px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-red-600"
            >
              Encuentra tu moto
            </motion.button>
            <motion.a
              href={linkWhatsApp(MENSAJE_WSP_GENERICO)}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="inline-flex min-h-[48px] items-center rounded-md border border-white/40 px-8 text-base font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
            >
              Cotizar por WhatsApp
            </motion.a>
          </motion.div>
        </div>

        {/* Indicador de scroll */}
        <div
          aria-hidden="true"
          className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-300 ${
            indicadorVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="label-mono text-[10px]">SCROLL</span>
            <svg
              className="animate-bounceDown"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FAFAFA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
