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

/* Colores de glow sutil por beneficio (acento + variación cálida/fría) */
const GLOW_COLORS = [
  "rgba(220,40,40,0.07)",
  "rgba(220,40,40,0.05)",
  "rgba(220,40,40,0.07)",
  "rgba(200,140,40,0.06)",
  "rgba(220,40,40,0.07)",
  "rgba(220,40,40,0.05)",
] as const;

const N = BENEFICIOS.length;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function GiroBeneficios() {
  const sectionRef = useRef<HTMLElement>(null);
  const mobileSectionRef = useRef<HTMLElement>(null);
  const motoDesktopRef = useRef<HTMLDivElement>(null);
  const motoDescentRef = useRef<HTMLDivElement>(null);
  const motoDescentMobileRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileProgress, setMobileProgress] = useState(0);
  const [reduce] = useState(() =>
    typeof window !== "undefined" ? prefiereMenosMovimiento() : false,
  );

  /* ── Desktop: progreso de scroll + descenso de la moto (estilo Zero) ── */
  useEffect(() => {
    if (!sectionRef.current || reduce) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setScrollProgress(self.progress),
      });

      // La moto desciende verticalmente ligada al scroll (scrub).
      if (motoDescentRef.current) {
        gsap.fromTo(
          motoDescentRef.current,
          { yPercent: -12 },
          {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  /* ── Mobile: progreso de scroll + descenso de la moto (estilo Zero) ── */
  useEffect(() => {
    if (!mobileSectionRef.current || reduce) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: mobileSectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setMobileProgress(self.progress),
      });

      // La moto desciende verticalmente ligada al scroll (scrub).
      if (motoDescentMobileRef.current) {
        gsap.fromTo(
          motoDescentMobileRef.current,
          { yPercent: -9 },
          {
            yPercent: 16,
            ease: "none",
            scrollTrigger: {
              trigger: mobileSectionRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      }
    }, mobileSectionRef);
    return () => ctx.revert();
  }, [reduce]);

  const progreso = reduce ? 0 : scrollProgress;
  const activoIdx = Math.min(N - 1, Math.floor(progreso * N));
  const activo = BENEFICIOS[activoIdx];

  const mobileProgreso = reduce ? 0 : mobileProgress;
  const activoMobileIdx = Math.min(N - 1, Math.floor(mobileProgreso * N));
  const activoMobile = BENEFICIOS[activoMobileIdx];

  /* ── Desktop: moto pan lateral sutil al cambiar de beneficio ───────── */
  useEffect(() => {
    if (!motoDesktopRef.current || reduce) return;
    const xTarget = activoIdx % 2 === 0 ? "2%" : "-2%";
    gsap.to(motoDesktopRef.current, {
      x: xTarget,
      duration: 1.2,
      ease: "expo.out",
    });
  }, [activoIdx, reduce]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP ≥768px — pin largo: moto girando 360 + beneficio activo
          ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={sectionRef}
        id="giro-beneficios"
        aria-label="Por qué Red Motos"
        className="relative hidden md:block"
        style={{ height: `${N * 100}vh` }}
      >
        <div
          className="grain sticky top-0 flex h-dvh flex-col overflow-hidden"
          style={{
            // Fondo temático Royal Enfield: estudio granate full-bleed que
            // funde con el fondo horneado de los frames 360.
            background:
              "radial-gradient(ellipse 95% 95% at 50% 46%, #5e3439 0%, #3a2024 55%, #1b1013 100%)",
          }}
        >

          {/* Glow radial cálido sutil detrás de la moto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 60% 70% at 50% 48%, ${GLOW_COLORS[activoIdx]} 0%, transparent 70%)`,
            }}
          />

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

          {/* Moto girando 360 — desciende con el scroll (outer) + pan lateral
              sutil por beneficio (inner). El granate del frame funde con el
              fondo de la sección. */}
          <div
            ref={motoDescentRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10"
          >
            <div
              ref={motoDesktopRef}
              className="flex h-full items-center justify-center"
            >
              <Viewer360
                slug="re-super-meteor-650-celestial"
                fallbackImg="/motos/CELESTIALRED.png"
                alt="Royal Enfield Super Meteor 650 Celestial"
                progreso={progreso}
                className="w-[82%] max-w-[1040px] translate-y-[-2%]"
              />
            </div>
          </div>

          {/* Máscaras granate (arriba/abajo) — funden el frame con el fondo y
              dan legibilidad al encabezado y al texto. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-36"
            style={{ background: "linear-gradient(to bottom, #1b1013 0%, transparent 100%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[42%]"
            style={{ background: "linear-gradient(to top, #1b1013 0%, #1b1013 16%, transparent 100%)" }}
          />

          {/* Beneficio activo — grande, abajo-izquierda */}
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
          MOBILE <768px — STICKY: moto en centro, beneficios cambian
          con el scroll. Patrón Zero Motorcycles exacto.
          ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={mobileSectionRef}
        id="giro-beneficios-mobile"
        aria-label="Por qué Red Motos"
        className="relative block md:hidden"
        style={{ height: `${N * 100}vh` }}
      >
        <div
          className="sticky top-0 h-dvh overflow-hidden"
          style={{
            // Fondo temático Royal Enfield: estudio granate full-bleed que
            // funde con el fondo horneado de los frames 360.
            background:
              "radial-gradient(ellipse 120% 82% at 50% 40%, #5e3439 0%, #3a2024 52%, #1b1013 100%)",
          }}
        >

          {/* Glow radial cálido sutil detrás de la moto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 80% 55% at 50% 46%, ${GLOW_COLORS[activoMobileIdx]} 0%, transparent 65%)`,
            }}
          />

          {/* Encabezado — arriba izquierda */}
          <div className="absolute left-0 right-0 top-0 z-20 px-5 pt-10">
            <p
              className="label-mono"
              style={{ color: "var(--accent)", fontSize: "11px" }}
            >
              POR QUÉ RED MOTOS
            </p>
          </div>

          {/* Moto STICKY — full-bleed: el granate del frame sangra por los
              lados y funde con el fondo de la sección (sin bordes de card).
              Desciende verticalmente ligada al scroll (estilo Zero). */}
          <div
            ref={motoDescentMobileRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 bottom-[14%] flex items-center justify-center"
          >
            <Viewer360
              slug="re-super-meteor-650-celestial"
              fallbackImg="/motos/CELESTIALRED.png"
              alt="Royal Enfield Super Meteor 650 Celestial"
              progreso={reduce ? 0.35 : mobileProgreso}
              className="w-[116%] max-w-none"
            />
          </div>

          {/* Máscaras granate (arriba/abajo) — funden los bordes del frame
              con el fondo y dan legibilidad al texto inferior. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28"
            style={{ background: "linear-gradient(to bottom, #1b1013 0%, transparent 100%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56"
            style={{ background: "linear-gradient(to top, #1b1013 0%, #1b1013 20%, transparent 100%)" }}
          />

          {/* Beneficio activo — abajo, sobre el gradiente inferior */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={activoMobile.num}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 32, x: -8 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={reduce ? { opacity: 1 } : { opacity: 0, y: -20 }}
                transition={{ duration: reduce ? 0 : 0.55, ease: EASE }}
              >
                <span
                  className="label-mono block"
                  style={{ color: "var(--accent)", fontSize: "12px" }}
                >
                  {activoMobile.num} / {String(N).padStart(2, "0")}
                </span>
                <h3
                  className="headline-display mt-2 text-white"
                  style={{ fontSize: "clamp(36px, 10vw, 52px)", lineHeight: 0.95 }}
                >
                  {activoMobile.titulo}
                </h3>
                <p
                  className="mt-3 leading-relaxed"
                  style={{ color: "var(--fg-muted)", fontSize: "15px" }}
                >
                  {activoMobile.desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Indicador de pasos */}
            <div className="mt-5 flex items-center gap-2">
              {BENEFICIOS.map((b, i) => (
                <span
                  key={b.num}
                  aria-hidden="true"
                  className="h-[2px] rounded-full transition-all duration-300"
                  style={{
                    width: i === activoMobileIdx ? "28px" : "14px",
                    background:
                      i === activoMobileIdx ? "var(--accent)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
