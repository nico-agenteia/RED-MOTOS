"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, prefiereMenosMovimiento } from "@/lib/gsap-setup";
import { linkWhatsApp } from "@/lib/config";

// ─── Tipos ──────────────────────────────────────────────────────────────────

type Spec = { valor: string; unidad: string; label: string };
type Modelo = {
  id: string;
  marca: string;
  nombre: string;
  familia: string;
  img: string;
  bg: string;
  acento: string;
  specs: Spec[];
  hermanos: string[];
  precioDesde: string;
};

// ─── Datos ───────────────────────────────────────────────────────────────────

const MODELOS: Modelo[] = [
  {
    id: "gsx-r1000r",
    marca: "Suzuki",
    nombre: "GSX-R1000R",
    familia: "RACING LINE",
    img: "/motos/GSX-R1000R.png",
    bg: "hsl(221, 60%, 6%)",
    acento: "#3B6FD4",
    specs: [
      { valor: "999", unidad: "CC", label: "CILINDRADA" },
      { valor: "202", unidad: "HP", label: "POTENCIA" },
      { valor: "299", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["GSX-S1000", "GSX-8S", "Hayabusa", "V-Strom 250"],
    precioDesde: "$ 13.999.900",
  },
  {
    id: "himalayan-452",
    marca: "Royal Enfield",
    nombre: "Himalayan 452",
    familia: "ADVENTURE LINE",
    img: "/motos/rally.png",
    bg: "hsl(36, 40%, 7%)",
    acento: "#D6A24A",
    specs: [
      { valor: "452", unidad: "CC", label: "CILINDRADA" },
      { valor: "40", unidad: "HP", label: "POTENCIA" },
      { valor: "160", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Scram 411", "Hunter 350", "Classic 350", "Meteor 350"],
    precioDesde: "$ 7.499.900",
  },
  {
    id: "super-meteor-650",
    marca: "Royal Enfield",
    nombre: "Super Meteor 650",
    familia: "CRUISER LINE",
    img: "/motos/CELESTIALRED.png",
    bg: "hsl(0, 35%, 7%)",
    acento: "#E2231A",
    specs: [
      { valor: "648", unidad: "CC", label: "CILINDRADA" },
      { valor: "47", unidad: "HP", label: "POTENCIA" },
      { valor: "180", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Classic 650", "Shotgun 650", "Bear 650"],
    precioDesde: "$ 9.999.900",
  },
  {
    id: "hunter-350",
    marca: "Royal Enfield",
    nombre: "Hunter 350",
    familia: "STREET LINE",
    img: "/motos/Hunter350.png",
    bg: "hsl(36, 25%, 8%)",
    acento: "#D6A24A",
    specs: [
      { valor: "349", unidad: "CC", label: "CILINDRADA" },
      { valor: "20", unidad: "HP", label: "POTENCIA" },
      { valor: "114", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Classic 350", "Meteor 350", "Scram 411"],
    precioDesde: "$ 4.699.900",
  },
  {
    id: "vstrom-250",
    marca: "Suzuki",
    nombre: "V-Strom 250",
    familia: "ADVENTURE LINE",
    img: "/motos/VSTROM250.png",
    bg: "hsl(221, 40%, 7%)",
    acento: "#3B6FD4",
    specs: [
      { valor: "248", unidad: "CC", label: "CILINDRADA" },
      { valor: "26", unidad: "HP", label: "POTENCIA" },
      { valor: "145", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Gixxer 150", "Gixxer 250", "GSX-8S"],
    precioDesde: "$ 4.799.900",
  },
];

const N = MODELOS.length;

const MENSAJE = (m: Modelo) =>
  `Hola! Vi la ${m.marca} ${m.nombre} en la web de Red Motos y quiero más info. ¿Me cotizan?`;

// ─── Animaciones (Framer Motion) ─────────────────────────────────────────────

const motoVariants = {
  enter: { x: -60, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: "easeIn" } },
};

const panelVariants = {
  enter: { y: 28, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

// ─── Subcomponente: specs con count-up GSAP ──────────────────────────────────

function SpecsCountUp({
  specs,
  acento,
  reducida,
}: {
  specs: Spec[];
  acento: string;
  reducida: boolean;
}) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (reducida) {
      // Sin animación: mostrar valor final directo.
      refs.current.forEach((el, i) => {
        if (el) el.textContent = specs[i]?.valor ?? "";
      });
      return;
    }

    const ctx = gsap.context(() => {
      specs.forEach((spec, i) => {
        const destino = parseFloat(spec.valor);
        const contador = { val: 0 };
        gsap.to(contador, {
          val: destino,
          duration: 1.2,
          ease: "power2.out",
          delay: i * 0.1,
          onUpdate: () => {
            const el = refs.current[i];
            if (el) el.textContent = Math.round(contador.val).toString();
          },
        });
      });
    });

    return () => ctx.revert();
  // Solo re-corre cuando cambia el modelo (acento cambia con el modelo).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acento, reducida]);

  return (
    <dl className="grid grid-cols-3 gap-4 md:gap-6">
      {specs.map((spec, i) => (
        <div key={spec.label} className="flex flex-col md:items-end">
          <dd
            className="font-display font-extrabold leading-none"
            style={{ fontSize: "clamp(40px, 5.5vw, 80px)", color: acento }}
          >
            <span ref={(el) => { refs.current[i] = el; }}>{spec.valor}</span>
            <span
              className="ml-1 font-mono text-[clamp(12px,1.4vw,18px)] font-medium uppercase tracking-wider"
              style={{ color: acento }}
            >
              {spec.unidad}
            </span>
          </dd>
          <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
            {spec.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

// ─── Subcomponente: panel de texto (nombre, hermanos, specs, precio, CTA) ────

function PanelModelo({
  modelo,
  reducida,
  className = "",
}: {
  modelo: Modelo;
  reducida: boolean;
  className?: string;
}) {
  return (
    <div className={`flex w-full flex-col ${className}`}>
      {/* Marca */}
      <span
        className="font-mono text-[11px] uppercase tracking-[0.3em]"
        style={{ color: modelo.acento }}
      >
        {modelo.marca}
      </span>

      {/* Nombre */}
      <h2
        className="headline-display mt-3 leading-[0.85] text-white"
        style={{ fontSize: "clamp(56px, 9vw, 132px)" }}
      >
        {modelo.nombre}
      </h2>

      {/* Hermanos fantasma */}
      <ul
        aria-label="Otros modelos de la familia"
        className="mt-5 flex flex-col gap-1 md:items-end"
      >
        {modelo.hermanos.map((h, i) => (
          <li
            key={h}
            className="headline-display text-white/20 transition-opacity duration-200 hover:text-white/45"
            style={{ fontSize: `${Math.max(20, 52 - i * 10)}px`, lineHeight: 1.05 }}
          >
            {h}
          </li>
        ))}
      </ul>

      {/* Línea divisoria + specs */}
      <div className="mt-10 w-full">
        <span
          aria-hidden="true"
          className="mb-5 block h-px w-full"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        />
        <SpecsCountUp specs={modelo.specs} acento={modelo.acento} reducida={reducida} />
      </div>

      {/* Precio + CTA */}
      <div className="mt-9 flex w-full flex-col gap-3 md:items-end">
        <p className="text-sm text-white/50">
          Desde <span className="font-medium text-white/80">{modelo.precioDesde}</span>{" "}
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/35">
            [referencial]
          </span>
        </p>
        <a
          href={linkWhatsApp(MENSAJE(modelo))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center rounded-md px-8 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{ backgroundColor: modelo.acento }}
        >
          Cotizar {modelo.nombre}
        </a>
      </div>
    </div>
  );
}

// ─── Desktop: un pin, fondo fijo, swap de moto ───────────────────────────────

function ShowcaseDesktop({ reducida }: { reducida: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  // Calcular índice activo según scroll (misma técnica que Hero.tsx).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const { top, height } = el.getBoundingClientRect();
        const winH = window.innerHeight;
        const denom = height - winH || 1;
        const progress = Math.max(0, Math.min(1, -top / denom));
        const idx = Math.min(N - 1, Math.floor(progress * N));
        setIndice(idx);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const modelo = MODELOS[indice];

  return (
    /* Contenedor exterior tall que da el scroll space */
    <div ref={wrapperRef} style={{ height: `${N * 100}vh` }} className="relative">
      {/* Contenedor sticky — fondo CONSTANTE */}
      <div
        className="sticky top-0 h-dvh overflow-hidden bg-black"
        style={{
          /* Fondo CONSTANTE 100% plano — solo cambia la moto, nunca el fondo. */
          background: "#0A0A0A",
        }}
      >
        {/* Grano de textura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Barra lateral: línea + familia rotada */}
        <div
          aria-hidden="true"
          className="absolute left-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 lg:flex"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="h-24 w-px bg-white/20" />
          <AnimatePresence mode="wait">
            <motion.span
              key={`familia-${modelo.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40"
            >
              {modelo.familia}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Indicador de progreso: número de modelo (01 / 05) */}
        <div
          aria-hidden="true"
          className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`idx-${indice}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              className="font-mono text-[11px] tabular-nums text-white/60"
            >
              {String(indice + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <span className="h-px w-5 bg-white/20" />
          <span className="font-mono text-[11px] tabular-nums text-white/20">
            {String(N).padStart(2, "0")}
          </span>
        </div>

        {/* Layout principal: moto izquierda / texto derecha */}
        <div className="mx-auto flex h-full max-w-7xl items-center gap-8 px-12 md:grid md:grid-cols-[1.15fr_0.85fr] md:gap-4">
          {/* Moto — crossfade con AnimatePresence */}
          <div className="flex w-full items-center justify-start">
            <AnimatePresence mode="wait">
              <motion.img
                key={`moto-${modelo.id}`}
                src={modelo.img}
                alt={`${modelo.marca} ${modelo.nombre}`}
                width={640}
                height={427}
                variants={reducida ? undefined : motoVariants}
                initial={reducida ? undefined : "enter"}
                animate={reducida ? undefined : "center"}
                exit={reducida ? undefined : "exit"}
                className="w-full max-w-[680px] object-contain"
                style={{
                  filter: `drop-shadow(0 30px 70px ${modelo.acento}55) drop-shadow(0 8px 24px rgba(0,0,0,0.6))`,
                }}
              />
            </AnimatePresence>
          </div>

          {/* Panel de texto — swap con AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`panel-${modelo.id}`}
              variants={reducida ? undefined : panelVariants}
              initial={reducida ? undefined : "enter"}
              animate={reducida ? undefined : "center"}
              exit={reducida ? undefined : "exit"}
              className="flex w-full justify-end"
            >
              <PanelModelo
                modelo={modelo}
                reducida={reducida}
                className="md:items-end md:text-right"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile: apilado vertical, reveal suave por tarjeta ──────────────────────

function ShowcaseMobile({ reducida }: { reducida: boolean }) {
  return (
    <div className="flex flex-col gap-0 bg-black">
      {MODELOS.map((modelo) => (
        <motion.article
          key={modelo.id}
          aria-label={`${modelo.marca} ${modelo.nombre}`}
          initial={reducida ? { opacity: 1 } : { opacity: 0, y: 40 }}
          whileInView={reducida ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-black px-5 py-16"
        >
          {/* Separador superior */}
          <span
            aria-hidden="true"
            className="mb-10 block h-px w-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          />

          {/* Moto */}
          <img
            src={modelo.img}
            alt={`${modelo.marca} ${modelo.nombre}`}
            width={560}
            height={373}
            loading="lazy"
            className="mx-auto mb-8 w-full max-w-[420px] object-contain"
            style={{
              filter: `drop-shadow(0 20px 50px ${modelo.acento}44) drop-shadow(0 4px 16px rgba(0,0,0,0.6))`,
            }}
          />

          {/* Familia */}
          <span
            className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/40"
          >
            {modelo.familia}
          </span>

          {/* Panel */}
          <PanelModelo modelo={modelo} reducida={reducida} />
        </motion.article>
      ))}
    </div>
  );
}

// ─── Componente raíz ─────────────────────────────────────────────────────────

export default function ShowcasePremium() {
  const [reducida, setReducida] = useState(false);

  // Suscribirse a prefers-reduced-motion de forma reactiva.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducida(mq.matches);
    sync();
    // Inicializar también con la función utilitaria (consistencia con el resto del repo).
    if (prefiereMenosMovimiento()) setReducida(true);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section aria-label="Modelos destacados" className="relative">
      {/* Desktop (≥768px): un pin, fondo fijo, swap de moto */}
      <div className="hidden md:block">
        <ShowcaseDesktop reducida={reducida} />
      </div>

      {/* Mobile (<768px): apilado vertical, sin pin */}
      <div className="block md:hidden">
        <ShowcaseMobile reducida={reducida} />
      </div>
    </section>
  );
}
