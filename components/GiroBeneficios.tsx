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

/* Glow cálido sutil por beneficio detrás de la moto */
const GLOW_COLORS = [
  "rgba(220,40,40,0.10)",
  "rgba(220,40,40,0.08)",
  "rgba(220,40,40,0.10)",
  "rgba(200,140,40,0.09)",
  "rgba(220,40,40,0.10)",
  "rgba(220,40,40,0.08)",
] as const;

const N = BENEFICIOS.length;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Fondo oscuro estilo Zero: casi negro con viñeta sutil. */
const BG_OSCURO =
  "radial-gradient(ellipse 100% 92% at 50% 44%, #18181a 0%, #0b0b0c 56%, #050506 100%)";

/* Opacidad de un beneficio según el tramo de scroll que le corresponde:
   1 en el centro de su tramo, desvanece hacia los bordes (cross-fade). */
function ventana(p: number, i: number) {
  const seg = 1 / N;
  const centro = (i + 0.5) * seg;
  return Math.max(0, Math.min(1, 1 - Math.abs(p - centro) / (seg * 0.72)));
}
/* Deriva vertical sutil mientras el beneficio cruza su ventana. */
function derivaY(p: number, i: number) {
  const seg = 1 / N;
  return (p - (i + 0.5) * seg) * -160;
}

export default function GiroBeneficios() {
  const sectionRef = useRef<HTMLElement>(null);
  const mobileSectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileProgress, setMobileProgress] = useState(0);
  const [reduce] = useState(() =>
    typeof window !== "undefined" ? prefiereMenosMovimiento() : false,
  );

  /* ── Desktop: progreso de scroll ────────────────────────────────────── */
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

  /* ── Mobile: progreso de scroll (mismo patrón sticky) ──────────────── */
  useEffect(() => {
    if (!mobileSectionRef.current || reduce) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: mobileSectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setMobileProgress(self.progress),
      });
    }, mobileSectionRef);
    return () => ctx.revert();
  }, [reduce]);

  const progreso = reduce ? 0 : scrollProgress;
  const activoIdx = Math.min(N - 1, Math.floor(progreso * N));

  const mobileProgreso = reduce ? 0 : mobileProgress;
  const activoMobileIdx = Math.min(N - 1, Math.floor(mobileProgreso * N));
  const activoMobile = BENEFICIOS[activoMobileIdx];
  const izqMobile = activoMobileIdx % 2 === 0;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP ≥768px — moto transparente flotando + girando con el scroll,
          beneficios apareciendo alternados izquierda/derecha (estilo Zero).
          ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={sectionRef}
        id="giro-beneficios"
        aria-label="Por qué Red Motos"
        className="relative hidden md:block"
        style={{ height: `${N * 100}vh` }}
      >
        <div
          className="grain sticky top-0 h-dvh overflow-hidden"
          style={{ background: BG_OSCURO }}
        >
          {/* Glow radial cálido detrás de la moto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 58% 70% at 50% 50%, ${GLOW_COLORS[activoIdx]} 0%, transparent 70%)`,
            }}
          />

          {/* Encabezado fijo arriba-izquierda */}
          <div className="absolute left-0 top-0 z-30 px-8 pt-16 xl:px-16">
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

          {/* Moto transparente — centro, gira con el scroll */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <Viewer360
              slug="re-super-meteor-650-celestial"
              fallbackImg="/motos/CELESTIALRED.png"
              alt="Royal Enfield Super Meteor 650 Celestial"
              progreso={progreso}
              className="w-[72%] max-w-[820px] translate-y-[-2%]"
            />
          </div>

          {/* Beneficios alternados — izquierda / derecha, cross-fade por scroll */}
          {BENEFICIOS.map((b, i) => {
            const izq = i % 2 === 0;
            const op = reduce ? (i === activoIdx ? 1 : 0) : ventana(progreso, i);
            const ty = reduce ? 0 : derivaY(progreso, i);
            return (
              <div
                key={b.num}
                aria-hidden={op < 0.05}
                className={`absolute z-20 max-w-[31%] ${
                  izq
                    ? "left-[6%] text-left xl:left-[8%]"
                    : "right-[6%] text-right xl:right-[8%]"
                }`}
                style={{
                  top: izq ? "27%" : "44%",
                  opacity: op,
                  transform: `translateY(${ty}px)`,
                }}
              >
                <span
                  className="label-mono block"
                  style={{ color: "var(--accent)", fontSize: "13px" }}
                >
                  {b.num} / {String(N).padStart(2, "0")}
                </span>
                <h3
                  className="headline-display mt-3 text-white"
                  style={{ fontSize: "clamp(40px, 5vw, 78px)", lineHeight: 0.95 }}
                >
                  {b.titulo}
                </h3>
                <p
                  className={`mt-4 leading-relaxed ${izq ? "" : "ml-auto"}`}
                  style={{
                    color: "var(--fg-muted)",
                    fontSize: "clamp(14px, 1.2vw, 18px)",
                    maxWidth: "360px",
                  }}
                >
                  {b.desc}
                </p>
              </div>
            );
          })}

          {/* Indicador de pasos 01–06 — abajo centro */}
          <div className="absolute bottom-10 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
            {BENEFICIOS.map((b, i) => (
              <span
                key={b.num}
                aria-hidden="true"
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: i === activoIdx ? "40px" : "20px",
                  background: i === activoIdx ? "var(--accent)" : "var(--surface-2)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE <768px — moto transparente girando, beneficio activo que
          alterna lado (izq/der) a medida que fluye el scroll.
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
          style={{ background: BG_OSCURO }}
        >
          {/* Glow radial cálido sutil detrás de la moto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 85% 55% at 50% 42%, ${GLOW_COLORS[activoMobileIdx]} 0%, transparent 65%)`,
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

          {/* Moto transparente — centro-superior, gira con el scroll */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 bottom-[26%] flex items-center justify-center"
          >
            <Viewer360
              slug="re-super-meteor-650-celestial"
              fallbackImg="/motos/CELESTIALRED.png"
              alt="Royal Enfield Super Meteor 650 Celestial"
              progreso={reduce ? 0.35 : mobileProgreso}
              className="w-[104%] max-w-none"
            />
          </div>

          {/* Difuminado inferior para legibilidad del texto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72"
            style={{ background: "linear-gradient(to top, #050506 0%, #050506 26%, transparent 100%)" }}
          />

          {/* Beneficio activo — abajo, alterna lado izq/der según el scroll */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 px-5 pb-28 ${
              izqMobile ? "text-left" : "text-right"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activoMobile.num}
                initial={
                  reduce ? { opacity: 1 } : { opacity: 0, y: 28, x: izqMobile ? -10 : 10 }
                }
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={reduce ? { opacity: 1 } : { opacity: 0, y: -16 }}
                transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                className={`max-w-[82%] ${izqMobile ? "mr-auto" : "ml-auto"}`}
              >
                <span
                  className="label-mono block"
                  style={{ color: "var(--accent)", fontSize: "12px" }}
                >
                  {activoMobile.num} / {String(N).padStart(2, "0")}
                </span>
                <h3
                  className="headline-display mt-2 text-white"
                  style={{ fontSize: "clamp(34px, 9.5vw, 50px)", lineHeight: 0.95 }}
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
            <div
              className={`mt-5 flex items-center gap-2 ${
                izqMobile ? "justify-start" : "justify-end"
              }`}
            >
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
