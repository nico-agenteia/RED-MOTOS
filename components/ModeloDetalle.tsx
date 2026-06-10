"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Viewer360 from "@/components/Viewer360";
import { CATALOGO, precioVigente } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import type { Moto } from "@/lib/tipos";

// ─── Constantes ──────────────────────────────────────────────────────────────
const PASO = 1 / 24; // un click de botón = 1/24 de vuelta
const PROGRESO_REDUCIDO = 0.35;

function mensajeCotizacion(moto: Moto): string {
  return `Hola! Vengo de la web de Red Motos. Me interesa la ${moto.marca} ${moto.modelo}. ¿Me pueden dar información y cotización?`;
}

// ─── Tarjeta hermana ─────────────────────────────────────────────────────────
function CardHermana({ moto }: { moto: Moto }) {
  return (
    <Link
      href={`/modelo/${moto.id}`}
      className="group block overflow-hidden rounded-xl border border-line bg-surface-2 transition-all duration-300 hover:border-white/25 hover:shadow-[0_16px_32px_rgba(0,0,0,0.4)]"
      aria-label={`Ver ${moto.marca} ${moto.modelo}`}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[hsl(0,0%,8%)] overflow-hidden">
        <img
          src={moto.img}
          alt={`${moto.marca} ${moto.modelo}`}
          width={320}
          height={240}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        {moto.precioBono !== null && (
          <span className="absolute left-3 top-3 rounded-sm bg-red-500 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-white">
            Bono
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="label-mono !text-[10px] mb-0.5">{moto.marca}</p>
        <h3 className="font-display text-lg font-bold uppercase text-white leading-tight">
          {moto.modelo}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          {moto.precioBono !== null ? (
            <>
              <span className="text-xs text-muted line-through">
                {formatCLP(moto.precioLista)}
              </span>
              <span className="font-display text-xl font-extrabold text-red-500">
                {formatCLP(moto.precioBono)}
              </span>
            </>
          ) : (
            <span className="font-display text-xl font-extrabold text-white">
              {formatCLP(moto.precioLista)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Variantes Framer Motion ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ModeloDetalle({ moto }: { moto: Moto }) {
  const prefersReducedMotion = useReducedMotion();

  // Progreso del visor 360 (0..1)
  const [progreso, setProgreso] = useState(
    prefersReducedMotion ? PROGRESO_REDUCIDO : 0,
  );

  const visorRef = useRef<HTMLDivElement>(null);
  const arrastreRef = useRef<{ activo: boolean; lastX: number }>({
    activo: false,
    lastX: 0,
  });
  // acumulador en "px" antes de convertir a progreso
  const acumuladoRef = useRef(0);

  // Ancho del contenedor visor para normalizar deltas
  const getAncho = useCallback(() => {
    return visorRef.current?.offsetWidth ?? 480;
  }, []);

  // Avanza/retrocede progreso con wrap en 0..1
  const moverProgreso = useCallback(
    (deltaX: number) => {
      if (prefersReducedMotion) return;
      acumuladoRef.current += deltaX;
      const ancho = getAncho();
      // Una vuelta completa = 1 ancho del visor
      const delta = acumuladoRef.current / ancho;
      if (Math.abs(delta) >= 1 / 48) {
        setProgreso((prev) => {
          let siguiente = prev - delta; // restar: arrastrar derecha = gira hacia adelante
          siguiente = ((siguiente % 1) + 1) % 1; // wrap modular
          return siguiente;
        });
        acumuladoRef.current = 0;
      }
    },
    [prefersReducedMotion, getAncho],
  );

  // ── Mouse drag ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion) return;
    arrastreRef.current = { activo: true, lastX: e.clientX };
    acumuladoRef.current = 0;
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!arrastreRef.current.activo) return;
      const delta = e.clientX - arrastreRef.current.lastX;
      arrastreRef.current.lastX = e.clientX;
      moverProgreso(delta);
    };

    const onMouseUp = () => {
      arrastreRef.current.activo = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [prefersReducedMotion, moverProgreso]);

  // ── Touch drag ────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (prefersReducedMotion) return;
    arrastreRef.current = { activo: true, lastX: e.touches[0].clientX };
    acumuladoRef.current = 0;
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = visorRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      if (!arrastreRef.current.activo) return;
      e.preventDefault(); // evita scroll al girar
      const delta = e.touches[0].clientX - arrastreRef.current.lastX;
      arrastreRef.current.lastX = e.touches[0].clientX;
      moverProgreso(delta);
    };

    const onTouchEnd = () => {
      arrastreRef.current.activo = false;
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [prefersReducedMotion, moverProgreso]);

  // ── Botones ‹ › ──────────────────────────────────────────────────────────
  const girarAntes = () => {
    if (prefersReducedMotion) return;
    setProgreso((prev) => ((prev - PASO) % 1 + 1) % 1);
  };
  const girarDespues = () => {
    if (prefersReducedMotion) return;
    setProgreso((prev) => (prev + PASO) % 1);
  };

  // ── Hermanos de misma marca ───────────────────────────────────────────────
  const hermanos = CATALOGO.filter(
    (m) => m.marca === moto.marca && m.id !== moto.id,
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-[72px]">
      {/* ── Sección visor 360 ───────────────────────────────────────────────── */}
      <section
        aria-label={`Vista 360 de ${moto.marca} ${moto.modelo}`}
        className="relative bg-[#0A0A0A] py-12"
      >
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          {/* Visor con drag */}
          <div
            ref={visorRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`relative select-none rounded-2xl overflow-hidden bg-[hsl(0,0%,6%)] border border-line ${
              prefersReducedMotion ? "" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{ aspectRatio: "16/9" }}
            aria-label={prefersReducedMotion ? undefined : "Arrastra para girar la moto"}
          >
            <Viewer360
              slug={moto.id}
              fallbackImg={moto.img}
              alt={`${moto.marca} ${moto.modelo}`}
              progreso={prefersReducedMotion ? PROGRESO_REDUCIDO : progreso}
              className="h-full w-full"
            />

            {/* Hint de arrastre — oculto en reduced-motion */}
            {!prefersReducedMotion && (
              <p
                aria-hidden="true"
                className="label-mono absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-line bg-black/60 px-4 py-1.5 text-[11px] backdrop-blur-sm"
              >
                Arrastra para girar
              </p>
            )}
          </div>

          {/* Botones ‹ › */}
          {!prefersReducedMotion && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={girarAntes}
                aria-label="Girar vista anterior"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5 active:scale-95"
              >
                ‹
              </button>
              <span className="label-mono text-[11px] text-muted">
                {Math.round(progreso * 360)}°
              </span>
              <button
                type="button"
                onClick={girarDespues}
                aria-label="Girar vista siguiente"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5 active:scale-95"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto max-w-4xl px-4 py-10 md:px-8"
        aria-label="Información del modelo"
      >
        <motion.p variants={fadeUp} className="label-mono mb-2 !text-[13px] text-red-500">
          {moto.marca}
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="headline-display text-white leading-none"
          style={{ fontSize: "clamp(40px, 8vw, 88px)" }}
        >
          {moto.modelo}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 text-muted text-lg">
          {moto.segmento} · {moto.cc} cc
        </motion.p>
      </motion.section>

      {/* ── Specs ──────────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        aria-label="Especificaciones"
        className="border-t border-line"
      >
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          <motion.p variants={fadeUp} className="label-mono mb-6 !text-[11px]">
            Especificaciones
          </motion.p>
          <motion.dl
            variants={stagger}
            className="grid grid-cols-2 gap-5 sm:grid-cols-4"
          >
            {/* Cilindrada */}
            <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
              <dt className="label-mono !text-[11px] mb-1">Cilindrada</dt>
              <dd className="font-display text-3xl font-extrabold text-white">
                {moto.cc} <span className="text-xl text-muted">cc</span>
              </dd>
            </motion.div>

            {/* Segmento */}
            <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
              <dt className="label-mono !text-[11px] mb-1">Segmento</dt>
              <dd className="font-display text-2xl font-extrabold text-white">
                {moto.segmento}
              </dd>
            </motion.div>

            {/* Usos */}
            <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
              <dt className="label-mono !text-[11px] mb-1">Usos</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {moto.usos.map((uso) => (
                  <span
                    key={uso}
                    className="rounded-sm border border-line px-2 py-0.5 font-mono text-[11px] text-white"
                  >
                    {uso}
                  </span>
                ))}
              </dd>
            </motion.div>

            {/* Principiante */}
            <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
              <dt className="label-mono !text-[11px] mb-1">Primera moto</dt>
              <dd
                className={`font-display text-2xl font-extrabold ${
                  moto.aptaPrincipiante ? "text-green-400" : "text-red-500"
                }`}
              >
                {moto.aptaPrincipiante ? "Sí" : "No"}
              </dd>
            </motion.div>
          </motion.dl>
        </div>
      </motion.section>

      {/* ── Precio ─────────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        aria-label="Precio"
        className="border-t border-line"
      >
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          <motion.p variants={fadeUp} className="label-mono mb-4 !text-[11px]">
            Precio
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-baseline gap-4">
            {moto.precioBono !== null ? (
              <>
                <span className="text-xl text-muted line-through">
                  {formatCLP(moto.precioLista)}
                </span>
                <span className="font-display font-extrabold text-red-500" style={{ fontSize: "clamp(40px, 7vw, 72px)" }}>
                  {formatCLP(moto.precioBono)}
                </span>
                <span className="rounded-sm bg-red-500 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white">
                  BONO
                </span>
              </>
            ) : (
              <span className="font-display font-extrabold text-white" style={{ fontSize: "clamp(40px, 7vw, 72px)" }}>
                {formatCLP(moto.precioLista)}
              </span>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* ── CTAs ───────────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        aria-label="Acciones"
        className="border-t border-line"
      >
        <div className="mx-auto flex max-w-4xl flex-wrap gap-4 px-4 py-10 md:px-8">
          <motion.a
            variants={fadeUp}
            href={linkWhatsApp(mensajeCotizacion(moto))}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex min-h-[48px] items-center rounded-md bg-red-500 px-8 font-semibold text-white transition-colors duration-200 hover:bg-red-600"
          >
            Cotizar por WhatsApp
          </motion.a>
          <motion.div variants={fadeUp}>
            <Link
              href="/#catalogo"
              className="inline-flex min-h-[48px] items-center rounded-md border border-line px-8 font-semibold text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
            >
              ← Volver al catálogo
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Hermanos de la misma marca ──────────────────────────────────────── */}
      {hermanos.length > 0 && (
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          aria-label={`Más modelos ${moto.marca}`}
          className="border-t border-line"
        >
          <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
            <motion.p variants={fadeUp} className="label-mono mb-2 !text-[11px]">
              También de {moto.marca}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="headline-display mb-8 text-white"
              style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
            >
              Más modelos
            </motion.h2>
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {hermanos.map((hermano) => (
                <motion.div key={hermano.id} variants={fadeUp}>
                  <CardHermana moto={hermano} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}
    </main>
  );
}
