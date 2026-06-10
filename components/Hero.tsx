"use client";

/**
 * Hero — la moto estrella (GSX-R 1000R) gira a pantalla completa mientras el
 * usuario hace scroll. Patrón "estilo Apple / AirPods", replicado del demo:
 *  - Contenedor 300vh con panel STICKY a pantalla completa.
 *  - Frames .webp precargados y dibujados en <canvas> (cover desktop / contain
 *    mobile, nítido con devicePixelRatio).
 *  - useScroll + useTransform mapean el progreso (0→1) al índice de frame.
 *  - Titulares que aparecen en ángulos clave del giro.
 *
 * Degradación elegante: si no hay frames (o reduced-motion), se muestra un hero
 * estático premium con la foto de la moto, mismo mensaje y CTAs.
 */

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { linkWhatsApp, MENSAJE_WSP_GENERICO, NEGOCIO } from "@/lib/config";
import { frames360 } from "@/lib/frames360";

const SLUG = "sz-gsx-r-1000r";
const FALLBACK_IMG = "/motos/GSX-R1000R.png";
const { count: TOTAL_FRAMES, framePath } = frames360(SLUG);

/** Titulares que aparecen en ángulos clave (rango de progreso 0–1). */
const TITULARES = [
  { desde: 0.02, hasta: 0.24, texto: "Mueve tu mundo", sub: "tu próxima moto te espera" },
  { desde: 0.36, hasta: 0.58, texto: "8 marcas oficiales", sub: "una sola curaduría" },
  { desde: 0.7, hasta: 0.92, texto: "Punto oficial", sub: "Royal Enfield" },
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Pide abrir el asistente del Recomendador IA (lo escucha RecomendadorIA). */
function abrirRecomendador() {
  window.dispatchEvent(new CustomEvent("rm:abrir-recomendador"));
}

export default function Hero() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "sin-frames">(
    TOTAL_FRAMES > 1 ? "cargando" : "sin-frames",
  );

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, Math.max(0, TOTAL_FRAMES - 1)],
  );
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  // Precarga de frames (solo si existen).
  useEffect(() => {
    if (TOTAL_FRAMES <= 1) return;
    let cancelado = false;
    const imgs: HTMLImageElement[] = [];
    let cargadas = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        cargadas++;
        if (!cancelado && cargadas === TOTAL_FRAMES) setEstado("listo");
      };
      imgs[i - 1] = img;
    }
    imagesRef.current = imgs;
    return () => {
      cancelado = true;
    };
  }, []);

  // Dibuja un frame en el canvas — cover (apaisado) / contain (vertical) + dpr.
  const dibujar = (idx: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[Math.max(0, Math.min(TOTAL_FRAMES - 1, idx))];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    const portrait = ch > cw;
    let dw: number;
    let dh: number;
    if (portrait) {
      // contain: moto completa en mobile
      if (ir > cr) {
        dw = cw;
        dh = cw / ir;
      } else {
        dh = ch;
        dw = ch * ir;
      }
    } else {
      // cover: la moto llena la pantalla en desktop
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
      } else {
        dw = cw;
        dh = cw / ir;
      }
    }
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  useMotionValueEvent(frameIndex, "change", (v) => {
    if (estado === "listo" && !reduce) dibujar(Math.round(v));
  });

  // Primer dibujo y redibujo en resize.
  useEffect(() => {
    if (estado !== "listo") return;
    const idx = reduce ? Math.floor(TOTAL_FRAMES / 2) : Math.round(frameIndex.get());
    dibujar(idx);
    const onResize = () => dibujar(idx);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, reduce]);

  // ── Fallback estático premium (sin frames o reduced-motion) ──────────────
  if (estado === "sin-frames" || reduce) {
    return <HeroEstatico />;
  }

  // ── Hero 360° a pantalla completa ────────────────────────────────────────
  return (
    <section
      id="hero"
      ref={containerRef}
      aria-label="Portada Red Motos"
      className="relative bg-black"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden">
        {/* Glow rojo de fondo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[75vmin] w-[75vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(226,35,26,0.22) 0%, rgba(226,35,26,0.06) 35%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Canvas 360 a pantalla completa */}
        <canvas
          ref={canvasRef}
          className="relative z-10 h-full w-full"
          aria-hidden="true"
        />

        {/* Loader premium durante la precarga */}
        {estado === "cargando" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black">
            <span className="label-mono">Preparando experiencia</span>
            <div className="h-px w-48 overflow-hidden bg-line">
              <div className="h-full w-1/3 animate-pulse bg-red-500" />
            </div>
          </div>
        )}

        {/* Titulares por ángulo */}
        {estado === "listo" &&
          TITULARES.map((t, i) => (
            <TituloAngulo
              key={i}
              progreso={scrollYProgress}
              desde={t.desde}
              hasta={t.hasta}
              texto={t.texto}
              sub={t.sub}
            />
          ))}

        {/* CTA fijo del hero */}
        {estado === "listo" && (
          <div className="absolute bottom-12 left-1/2 z-20 -translate-x-1/2 md:bottom-16">
            <HeroCtas />
          </div>
        )}

        {/* Indicador de scroll */}
        {estado === "listo" && (
          <motion.div
            className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
            style={{ opacity: scrollHintOpacity }}
            aria-hidden="true"
          >
            <span className="label-mono text-[10px]">SCROLL</span>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/** Titular que se desvanece dentro/fuera en su rango de progreso. */
function TituloAngulo({
  progreso,
  desde,
  hasta,
  texto,
  sub,
}: {
  progreso: ReturnType<typeof useScroll>["scrollYProgress"];
  desde: number;
  hasta: number;
  texto: string;
  sub: string;
}) {
  const medio = (desde + hasta) / 2;
  const opacity = useTransform(progreso, [desde, medio, hasta], [0, 1, 0]);
  const y = useTransform(progreso, [desde, hasta], [24, -24]);
  return (
    <motion.div
      style={{ opacity, y }}
      className="pointer-events-none absolute left-0 right-0 top-[22%] z-20 px-6 text-center"
    >
      <h2
        className="headline-display text-white"
        style={{ fontSize: "clamp(40px, 8vw, 96px)", lineHeight: 0.92 }}
      >
        {texto}
      </h2>
      <p className="mt-3 text-lg sm:text-2xl" style={{ color: "var(--fg-muted)" }}>
        {sub}
      </p>
    </motion.div>
  );
}

function HeroCtas() {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
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
    </div>
  );
}

/**
 * HeroEstatico — versión sin scroll-scrub (sin frames o reduced-motion).
 * Misma estética: moto centrada a pantalla, glow rojo, titular y CTAs.
 */
function HeroEstatico() {
  return (
    <section
      id="hero"
      aria-label={`Portada ${NEGOCIO.nombre}`}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black pt-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(226,35,26,0.2) 0%, rgba(226,35,26,0.05) 35%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Moto centrada */}
      <img
        src={FALLBACK_IMG}
        alt="Suzuki GSX-R 1000R"
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 z-0 w-[92vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-90"
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="label-mono mb-6"
        >
          {NEGOCIO.claim} · Punto oficial Royal Enfield
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease: EASE }}
          className="headline-display text-white"
          style={{ fontSize: "clamp(48px, 9vw, 104px)", lineHeight: 0.92 }}
        >
          Mueve tu mundo.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mt-9"
        >
          <HeroCtas />
        </motion.div>
      </div>
    </section>
  );
}
