"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Viewer360 from "./Viewer360";
import { gsap, ScrollTrigger, prefiereMenosMovimiento } from "@/lib/gsap-setup";

/* ── Datos de los 6 beneficios ──────────────────────────────────────── */
const BENEFICIOS = [
  { num: "01", titulo: "GARANTÍA OFICIAL", desc: "Royal Enfield con respaldo de fábrica." },
  { num: "02", titulo: "POSTVENTA EN CHILE", desc: "Servicio técnico y repuestos asegurados." },
  { num: "03", titulo: "FINANCIAMIENTO EN EL ACTO", desc: "Aprobación rápida, cuotas a tu medida." },
  { num: "04", titulo: "PUNTO OFICIAL RE", desc: "Concesionario autorizado en Santiago." },
  { num: "05", titulo: "8 MARCAS OFICIALES", desc: "Royal Enfield, Suzuki y más bajo un techo." },
  { num: "06", titulo: "3 SUCURSALES", desc: "La Florida, La Cisterna y Casa Matriz." },
] as const;

const N = BENEFICIOS.length;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function GiroBeneficios() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reduce] = useState(() =>
    typeof window !== "undefined" ? prefiereMenosMovimiento() : false,
  );

  /* ── Progreso de scroll con ScrollTrigger (más eficiente que rAF) ────── */
  useEffect(() => {
    if (!sectionRef.current || reduce) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setScrollProgress(self.progress),
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  const progreso = reduce ? 0 : scrollProgress;
  /* Beneficio activo según el tramo de scroll (1 beneficio por tramo). */
  const activoIdx = Math.min(N - 1, Math.floor(progreso * N));
  const activo = BENEFICIOS[activoIdx];

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP ≥768px — pin largo: moto girando 360 + beneficio activo
          que cambia al scrollear (estilo Zero / Apple)
          ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={sectionRef}
        id="giro-beneficios"
        aria-label="Por qué Red Motos"
        className="relative hidden md:block"
        style={{ height: `${N * 100}vh` }}
      >
        <div className="grain sticky top-0 flex h-dvh flex-col overflow-hidden bg-black">
          {/* Encabezado fijo arriba-izquierda */}
          <div className="relative z-20 px-8 pt-16 xl:px-16">
            <p className="label-mono mb-2" style={{ color: "var(--accent)" }}>
              ROYAL ENFIELD · SUPER METEOR 650 CELESTIAL
            </p>
            <h2
              className="headline-display text-white"
              style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
            >
              POR QUÉ RED MOTOS
            </h2>
          </div>

          {/* Moto girando 360 — ocupa el centro, gira a lo largo de toda la sección */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <Viewer360
              slug="re-super-meteor-650-celestial"
              fallbackImg="/motos/CELESTIALRED.png"
              alt="Royal Enfield Super Meteor 650 Celestial"
              progreso={progreso}
              className="w-full max-w-[820px] translate-y-[-4%]"
            />
          </div>

          {/* Beneficio activo — grande, abajo-izquierda, cambia con el scroll */}
          <div className="relative z-20 mt-auto px-8 pb-20 xl:px-16">
            <div className="min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activo.num}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0, y: -28 }}
                  transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                  className="max-w-[680px]"
                >
                  <span
                    className="label-mono block"
                    style={{ color: "var(--accent)", fontSize: "13px" }}
                  >
                    {activo.num} / {String(N).padStart(2, "0")}
                  </span>
                  <h3
                    className="headline-display mt-3 text-white"
                    style={{ fontSize: "clamp(44px, 6vw, 88px)", lineHeight: 0.95 }}
                  >
                    {activo.titulo}
                  </h3>
                  <p
                    className="mt-4 max-w-[440px] leading-relaxed"
                    style={{ color: "var(--fg-muted)", fontSize: "clamp(15px, 1.3vw, 19px)" }}
                  >
                    {activo.desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Indicador de pasos 01–06 */}
            <div className="mt-8 flex items-center gap-3">
              {BENEFICIOS.map((b, i) => (
                <span
                  key={b.num}
                  aria-hidden="true"
                  className="h-[3px] rounded-full transition-all duration-300"
                  style={{
                    width: i === activoIdx ? "40px" : "20px",
                    background:
                      i === activoIdx ? "var(--accent)" : "var(--surface-2)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE <768px — apilado con reveal, títulos grandes
          ══════════════════════════════════════════════════════════════════ */}
      <section
        id="giro-beneficios-mobile"
        aria-label="Por qué Red Motos"
        className="block bg-black py-20 md:hidden"
      >
        <div className="px-5">
          <p className="label-mono mb-2" style={{ color: "var(--accent)" }}>
            ROYAL ENFIELD · SUPER METEOR 650 CELESTIAL
          </p>
          <h2
            className="headline-display mb-10 text-white"
            style={{ fontSize: "clamp(30px, 8vw, 48px)" }}
          >
            POR QUÉ RED MOTOS
          </h2>

          {/* Moto arriba */}
          <div aria-hidden="true" className="pointer-events-none mb-14">
            <Viewer360
              slug="re-super-meteor-650-celestial"
              fallbackImg="/motos/CELESTIALRED.png"
              alt="Royal Enfield Super Meteor 650 Celestial"
              progreso={reduce ? 0 : 0.35}
              className="mx-auto w-full max-w-[380px]"
            />
          </div>

          {/* Beneficios apilados grandes con reveal */}
          <div className="flex flex-col gap-12">
            {BENEFICIOS.map((b) => (
              <motion.div
                key={b.num}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
              >
                <span
                  className="label-mono block"
                  style={{ color: "var(--accent)", fontSize: "12px" }}
                >
                  {b.num} / {String(N).padStart(2, "0")}
                </span>
                <h3
                  className="headline-display mt-2 text-white"
                  style={{ fontSize: "clamp(30px, 9vw, 48px)", lineHeight: 0.98 }}
                >
                  {b.titulo}
                </h3>
                <p
                  className="mt-3 leading-relaxed"
                  style={{ color: "var(--fg-muted)", fontSize: "16px" }}
                >
                  {b.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
