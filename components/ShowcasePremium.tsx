"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, ScrollTrigger, prefiereMenosMovimiento } from "@/lib/gsap-setup";
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

// Una moto representativa (la más icónica) por cada marca oficial.
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
    hermanos: ["GSX-S1000", "GSX-8S", "Hayabusa", "V-Strom"],
    precioDesde: "$ 19.999.900",
  },
  {
    id: "super-meteor-650",
    marca: "Royal Enfield",
    nombre: "Super Meteor 650",
    familia: "CRUISER LINE",
    img: "/motos/re-super-meteor-celestial.png",
    bg: "hsl(0, 35%, 7%)",
    acento: "#E2231A",
    specs: [
      { valor: "648", unidad: "CC", label: "CILINDRADA" },
      { valor: "47", unidad: "HP", label: "POTENCIA" },
      { valor: "180", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Classic 650", "Shotgun 650", "Bear 650", "Hunter 350"],
    precioDesde: "$ 6.999.900",
  },
  {
    id: "cyclone-ra2",
    marca: "Cyclone",
    nombre: "RA2",
    familia: "NAKED LINE",
    img: "/motos/RA2.png",
    bg: "hsl(10, 40%, 7%)",
    acento: "#E0552B",
    specs: [
      { valor: "250", unidad: "CC", label: "CILINDRADA" },
      { valor: "27", unidad: "HP", label: "POTENCIA" },
      { valor: "130", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["RX-401", "RX-401 Maletas", "RX1"],
    precioDesde: "$ 2.699.900",
  },
  {
    id: "zonsen-rx3",
    marca: "Zonsen",
    nombre: "RX3",
    familia: "ADVENTURE LINE",
    img: "/motos/placeholder.png",
    bg: "hsl(270, 25%, 8%)",
    acento: "#9B7BD4",
    specs: [
      { valor: "250", unidad: "CC", label: "CILINDRADA" },
      { valor: "28", unidad: "HP", label: "POTENCIA" },
      { valor: "135", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["ZII"],
    precioDesde: "$ 3.099.900",
  },
  {
    id: "kymco-xtown-300",
    marca: "Kymco",
    nombre: "X-Town 300",
    familia: "URBAN LINE",
    img: "/motos/xtown300.png",
    bg: "hsl(152, 30%, 7%)",
    acento: "#3FB97E",
    specs: [
      { valor: "300", unidad: "CC", label: "CILINDRADA" },
      { valor: "28", unidad: "HP", label: "POTENCIA" },
      { valor: "130", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["MXU 150", "MXU 250", "MXU 300R", "UXV 450"],
    precioDesde: "$ 3.999.900",
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
  mostrarHermanos = true,
}: {
  modelo: Modelo;
  reducida: boolean;
  className?: string;
  mostrarHermanos?: boolean;
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

      {/* Hermanos fantasma — solo donde hay espacio (desktop) */}
      {mostrarHermanos && (
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
      )}

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
  const bgRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  // ScrollTrigger: índice activo + progress bar
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ctx = gsap.context(() => {
      // Barra de progreso lateral (scaleX 0 → 1 mientras scrolleas el showcase)
      if (progressBarRef.current) {
        gsap.fromTo(
          progressBarRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "linear",
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0,
            },
          },
        );
      }

      // Índice del modelo activo
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          setIndice(Math.min(N - 1, Math.floor(self.progress * N)));
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  // Transición suave del color de fondo cuando cambia el modelo
  useEffect(() => {
    if (!bgRef.current || reducida) return;
    gsap.to(bgRef.current, {
      backgroundColor: MODELOS[indice].bg,
      duration: 0.7,
      ease: "power2.inOut",
    });
  }, [indice, reducida]);

  const modelo = MODELOS[indice];

  return (
    /* Contenedor exterior tall que da el scroll space */
    <div ref={wrapperRef} style={{ height: `${N * 100}vh` }} className="relative">
      {/* Contenedor sticky — fondo dinámico por modelo */}
      <div
        ref={bgRef}
        className="sticky top-0 h-dvh overflow-hidden"
        style={{ backgroundColor: MODELOS[0].bg }}
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

        {/* Barra de progreso — patrón Zero Motorcycles */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-6 hidden h-px w-16 overflow-hidden bg-white/15 lg:block"
        >
          <div
            ref={progressBarRef}
            className="h-full w-full origin-left bg-white/70"
            style={{ transform: "scaleX(0)" }}
          />
        </div>

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
                mostrarHermanos={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile: full-bleed por modelo, mitad delantera asomando (tipo Zero) ─────

function ShowcaseMobile({ reducida }: { reducida: boolean }) {
  return (
    <div className="flex flex-col">
      {MODELOS.map((modelo, i) => (
        <article
          key={modelo.id}
          aria-label={`${modelo.marca} ${modelo.nombre}`}
          className="relative min-h-[100svh] overflow-hidden"
          style={{ backgroundColor: modelo.bg }}
        >
          {/* Grano de textura del color del modelo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "160px 160px",
            }}
          />

          {/* Número gigante fantasma de fondo */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-[4vw] left-2 font-display font-extrabold leading-none text-white/[0.04]"
            style={{ fontSize: "46vw" }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>

          {/* Moto — solo la mitad delantera asoma desde la derecha.
              Container con overflow:hidden + imagen 150% anclada a la derecha:
              el faro y el manubrio quedan visibles, la rueda trasera sale por
              la izquierda del frame (igual que zeromotorcycles.com en mobile). */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-[54vh] overflow-hidden"
            initial={reducida ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={modelo.img}
              alt={`${modelo.marca} ${modelo.nombre}`}
              width={560}
              height={373}
              loading="lazy"
              className="absolute right-0 top-1/2 w-[150%] max-w-none -translate-y-1/2 object-contain"
              style={{
                objectPosition: "right center",
                filter: `drop-shadow(0 24px 60px ${modelo.acento}55) drop-shadow(0 6px 20px rgba(0,0,0,0.7))`,
              }}
            />
          </motion.div>

          {/* Velo del color del modelo: funde la base de la moto con el texto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${modelo.bg} 28%, transparent 62%)`,
            }}
          />

          {/* Texto del modelo, debajo de la moto */}
          <div className="relative z-10 px-5 pb-16 pt-[48vh]">
            <div className="mb-4 flex items-center justify-between">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.35em]"
                style={{ color: modelo.acento }}
              >
                {modelo.familia}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-white/40">
                {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
              </span>
            </div>
            <PanelModelo
              modelo={modelo}
              reducida={reducida}
              mostrarHermanos={false}
            />
          </div>
        </article>
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
