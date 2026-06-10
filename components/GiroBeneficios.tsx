"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Viewer360 from "./Viewer360";
import { prefiereMenosMovimiento } from "@/lib/gsap-setup";

/* ── Datos de los 6 beneficios ──────────────────────────────────────── */
const BENEFICIOS = [
  {
    num: "01",
    titulo: "GARANTÍA OFICIAL",
    desc: "Royal Enfield con respaldo de fábrica.",
  },
  {
    num: "02",
    titulo: "POSTVENTA EN CHILE",
    desc: "Servicio técnico y repuestos asegurados.",
  },
  {
    num: "03",
    titulo: "FINANCIAMIENTO EN EL ACTO",
    desc: "Aprobación rápida, cuotas a tu medida.",
  },
  {
    num: "04",
    titulo: "PUNTO OFICIAL RE",
    desc: "Concesionario autorizado en Santiago.",
  },
  {
    num: "05",
    titulo: "8 MARCAS OFICIALES",
    desc: "Royal Enfield, Suzuki y más bajo un techo.",
  },
  {
    num: "06",
    titulo: "3 SUCURSALES",
    desc: "La Florida, La Cisterna y Casa Matriz.",
  },
] as const;

/* ── Variantes Framer Motion para los bloques ───────────────────────── */
const itemVariants = {
  hidden: { x: -60, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

export default function GiroBeneficios() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reduce] = useState(() =>
    typeof window !== "undefined" ? prefiereMenosMovimiento() : false
  );

  /* ── Scroll progress dentro de la sección sticky ───────────────────── */
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
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Progreso efectivo: fijo en 0 cuando el usuario prefiere menos movimiento */
  const progreso = reduce ? 0 : scrollProgress;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP ≥768px — sección sticky 200vh con moto + beneficios
          ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={sectionRef}
        id="giro-beneficios"
        aria-label="Por qué Red Motos"
        className="relative hidden md:block"
        style={{ height: "200vh" }}
      >
        {/* Contenedor sticky */}
        <div
          className="grain sticky top-0 h-dvh overflow-hidden bg-black"
          style={{ position: "sticky", top: 0 }}
        >
          {/* Gradiente sutil en bordes para dar profundidad */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 40% 50%, rgba(226,35,26,0.06) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 flex h-full flex-col px-8 xl:px-16">
            {/* ── Encabezado ─────────────────────────────────────────────── */}
            <div className="pt-16 pb-8">
              <p className="label-mono mb-3" style={{ color: "var(--accent)" }}>
                ROYAL ENFIELD · SUPER METEOR 650 CELESTIAL
              </p>
              <h2
                className="headline-display text-white"
                style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
              >
                POR QUÉ RED MOTOS
              </h2>
            </div>

            {/* ── Layout moto + beneficios ───────────────────────────────── */}
            <div className="flex flex-1 items-center gap-8 xl:gap-16">
              {/* Moto 360 — lado izquierdo */}
              <div
                aria-hidden="true"
                className="pointer-events-none flex-1"
                style={{ minWidth: 0 }}
              >
                <Viewer360
                  slug="re-super-meteor-650-celestial"
                  fallbackImg="/motos/CELESTIALRED.png"
                  alt="Royal Enfield Super Meteor 650 Celestial"
                  progreso={progreso}
                  className="mx-auto w-full max-w-[640px]"
                />
              </div>

              {/* Beneficios — lado derecho */}
              <div
                className="flex flex-col gap-5 xl:gap-6"
                style={{ width: "clamp(280px, 38%, 480px)", flexShrink: 0 }}
              >
                {BENEFICIOS.map((b, i) => (
                  <motion.div
                    key={b.num}
                    custom={i}
                    initial={reduce ? "visible" : "hidden"}
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={itemVariants}
                    className="flex items-start gap-4 border-b pb-5 last:border-b-0 last:pb-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {/* Número acento */}
                    <span
                      className="label-mono shrink-0 pt-0.5 text-[11px]"
                      style={{ color: "var(--accent)", letterSpacing: "0.15em" }}
                    >
                      {b.num}
                    </span>

                    <div>
                      <p
                        className="headline-display text-white"
                        style={{ fontSize: "clamp(14px, 1.4vw, 18px)", lineHeight: 1.1 }}
                      >
                        {b.titulo}
                      </p>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        {b.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Indicador de progreso lineal en la base */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-[2px] w-full"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${progreso * 100}%`,
                  background: "var(--accent)",
                  transition: reduce ? "none" : "width 0.1s linear",
                  willChange: "width",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE <768px — apilado, sin pin
          ══════════════════════════════════════════════════════════════════ */}
      <section
        id="giro-beneficios-mobile"
        aria-label="Por qué Red Motos"
        className="block bg-black py-20 md:hidden"
        style={{
          background:
            "radial-gradient(ellipse 120% 60% at 50% 0%, rgba(226,35,26,0.07) 0%, #000 55%)",
        }}
      >
        <div className="px-5">
          {/* Encabezado */}
          <p className="label-mono mb-3" style={{ color: "var(--accent)" }}>
            ROYAL ENFIELD · SUPER METEOR 650 CELESTIAL
          </p>
          <h2
            className="headline-display mb-10 text-white"
            style={{ fontSize: "clamp(32px, 9vw, 52px)" }}
          >
            POR QUÉ RED MOTOS
          </h2>

          {/* Moto estática arriba */}
          <div aria-hidden="true" className="pointer-events-none mb-12">
            <Viewer360
              slug="re-super-meteor-650-celestial"
              fallbackImg="/motos/CELESTIALRED.png"
              alt="Royal Enfield Super Meteor 650 Celestial"
              progreso={reduce ? 0 : 0.35}
              className="mx-auto w-full max-w-[380px]"
            />
          </div>

          {/* Beneficios apilados */}
          <div className="flex flex-col gap-0">
            {BENEFICIOS.map((b, i) => (
              <motion.div
                key={b.num}
                custom={i}
                initial={reduce ? "visible" : "hidden"}
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={itemVariants}
                className="flex items-start gap-4 border-b py-5 last:border-b-0"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="label-mono shrink-0 pt-0.5"
                  style={{ color: "var(--accent)", fontSize: "11px" }}
                >
                  {b.num}
                </span>
                <div>
                  <p
                    className="headline-display text-white"
                    style={{ fontSize: "clamp(15px, 4.5vw, 20px)", lineHeight: 1.1 }}
                  >
                    {b.titulo}
                  </p>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
