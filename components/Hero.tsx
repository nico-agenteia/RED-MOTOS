"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { linkWhatsApp, MENSAJE_WSP_GENERICO, NEGOCIO } from "@/lib/config";

/**
 * Hero estilo Zero Motorcycles: sección de 300vh con contenido sticky.
 * El scroll dentro de la sección hace "scrub" sobre la moto protagonista.
 *
 * Hay dos modos:
 *  - Frames reales 360° (TOTAL_FRAMES = 144) → se dibujan en <canvas>.
 *  - Placeholder (TOTAL_FRAMES = 1) → PNG con scrub sutil (rotación contenida
 *    + deriva + escala). NO se hace un giro completo porque un PNG plano
 *    desaparecería de canto a 90°/270°.
 *
 * Los frames `/public/360/hero/frame_001.webp … frame_144.webp` aún no existen
 * (se generarán con kie.ai). Cuando existan, subir TOTAL_FRAMES a 144.
 */
const TOTAL_FRAMES = 1;
const FRAME_PATH = (n: number) =>
  `/360/hero/frame_${String(n).padStart(3, "0")}.webp`;

/** Pide abrir el asistente del Recomendador IA (lo escucha RecomendadorIA). */
function abrirRecomendador() {
  window.dispatchEvent(new CustomEvent("rm:abrir-recomendador"));
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicadorVisible, setIndicadorVisible] = useState(true);
  const [framesListas, setFramesListas] = useState(false);
  const [reduce, setReduce] = useState(false);

  // Respetar prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Precargar frames reales (solo si existen).
  useEffect(() => {
    if (TOTAL_FRAMES <= 1) return;
    const imgs: HTMLImageElement[] = [];
    let cargadas = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        cargadas++;
        if (cargadas === TOTAL_FRAMES) setFramesListas(true);
      };
      imgs.push(img);
    }
    framesRef.current = imgs;
  }, []);

  // Dibujar el frame correspondiente al progreso de scroll.
  useEffect(() => {
    if (!framesListas || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const idx = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(scrollProgress * TOTAL_FRAMES),
    );
    const frame = framesRef.current[idx];
    if (frame) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(frame, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [scrollProgress, framesListas]);

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

  // Scrub del placeholder: giro contenido (-14°→14°), deriva y escala suaves.
  const giro = reduce ? 0 : (scrollProgress - 0.5) * 28; // grados
  const deriva = reduce ? 0 : (0.5 - scrollProgress) * 6; // rem (entra de la derecha)
  const escala = reduce ? 1 : 1 + scrollProgress * 0.08;
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

        {/* CANVAS — modo frames 360° reales */}
        {TOTAL_FRAMES > 1 && (
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 w-[65vw] max-w-[800px] -translate-x-1/2 -translate-y-1/2"
            style={{ willChange: "transform" }}
          />
        )}

        {/* MOTO placeholder — scrub contenido (hasta tener frames reales) */}
        {TOTAL_FRAMES <= 1 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[3%] top-1/2 w-[62vw] max-w-[680px] md:right-[6%] md:w-[52vw]"
            style={{
              transform: `translateY(-50%) translateX(${deriva}rem) perspective(1400px) rotateY(${giro}deg) scale(${escala})`,
              willChange: "transform",
            }}
          >
            <img
              src="/motos/GSX-R1000R.png"
              alt="Suzuki GSX-R1000R"
              width={680}
              height={453}
              className="w-full object-contain drop-shadow-[0_30px_80px_rgba(226,35,26,0.28)]"
            />
          </div>
        )}

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
