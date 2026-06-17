"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReveal } from "@/lib/useReveal";

/* ── Datos ────────────────────────────────────────────────────────────── */

const FOTOS_LOCAL = [
  "/nosotros/local-1.jpg",
  "/nosotros/local-2.jpg",
  "/nosotros/local-3.jpg",
  "/nosotros/local-4.jpg",
  "/nosotros/local-5.jpg",
];

const VALORES = [
  { icono: "check", texto: "Calidad de nuestro trabajo" },
  { icono: "check", texto: "Confiables" },
  { icono: "check", texto: "Alta integridad" },
  { icono: "check", texto: "Brindando el mejor servicio" },
  { icono: "check", texto: "Mecánicos Profesionales" },
  { icono: "check", texto: "Alcance a todo Chile" },
];

const EQUIPO = [
  { foto: "/nosotros/team-1.jpg", nombre: "Nacho Armengol Merino" },
  { foto: "/nosotros/team-2.jpg", nombre: "Paola Figueroa Escolano" },
  { foto: "/nosotros/team-1.jpg", nombre: "Alejo Pizarro Molina" },
];

const GALERIA_IG = [
  { img: "/nosotros/gal-1.jpg", link: "https://www.instagram.com/p/ChLEl9QpF-5/" },
  { img: "/nosotros/gal-2.jpg", link: "https://www.instagram.com/p/ChXzL9LJN00/" },
  { img: "/nosotros/gal-3.jpg", link: "https://www.instagram.com/p/ChLE9rLpbxm/" },
  { img: "/nosotros/gal-4.jpg", link: "https://www.instagram.com/p/ChVTOzgJPYh/" },
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const AUTOPLAY_MS = 3500;

/* ── Iconos inline ────────────────────────────────────────────────────── */

function IconoCheck() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E2231A"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-[2px] shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/* ── Carrusel de fotos del local ──────────────────────────────────────── */

function CarruselLocal() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((p) => (p + 1) % FOTOS_LOCAL.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
      <div className="aspect-[4/3]">
        <AnimatePresence mode="wait">
          <motion.img
            key={FOTOS_LOCAL[idx]}
            src={FOTOS_LOCAL[idx]}
            alt={`Red Motos tienda — vista ${idx + 1}`}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            draggable={false}
          />
        </AnimatePresence>
      </div>
      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {FOTOS_LOCAL.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a foto ${i + 1}`}
            onClick={() => setIdx(i)}
            className="flex h-6 w-6 items-center justify-center"
          >
            <span
              className={`block h-[6px] rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-6 bg-red-500"
                  : "w-[6px] bg-white/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────── */

export default function Nosotros() {
  const heroRef = useReveal<HTMLDivElement>(".nos-hero-reveal", {
    y: 40,
    stagger: 0.12,
    start: "top 85%",
  });

  const aboutRef = useReveal<HTMLDivElement>(".nos-about-reveal", {
    y: 36,
    stagger: 0.1,
    start: "top 78%",
  });

  const teamRef = useReveal<HTMLDivElement>(".nos-team-reveal", {
    y: 40,
    stagger: 0.12,
    start: "top 80%",
  });

  const igRef = useReveal<HTMLDivElement>(".nos-ig-reveal", {
    y: 30,
    stagger: 0.08,
    start: "top 82%",
  });

  return (
    <section id="nosotros" aria-label="Quiénes somos">
      {/* ── Banner hero ──────────────────────────────────────────────── */}
      <div
        className="relative flex min-h-[50vh] items-center justify-center overflow-hidden md:min-h-[60vh]"
        style={{
          backgroundImage: "url(/nosotros/banner-nosotros.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div ref={heroRef} className="relative z-10 px-4 text-center">
          <p className="nos-hero-reveal label-mono mb-3">Red Motos Chile</p>
          <h2
            className="nos-hero-reveal headline-display text-white"
            style={{ fontSize: "clamp(48px, 8vw, 88px)" }}
          >
            Nosotros
          </h2>
          <p className="nos-hero-reveal mx-auto mt-4 max-w-lg text-lg text-white/70">
            Más de una década acercando la mejor experiencia en motos a todo Chile
          </p>
        </div>
      </div>

      {/* ── Sección About: carrusel + valores ────────────────────────── */}
      <div className="bg-black py-24">
        <div
          ref={aboutRef}
          className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-4 md:grid-cols-2 md:items-center md:px-8"
        >
          {/* Columna izquierda — carrusel */}
          <div className="nos-about-reveal">
            <CarruselLocal />
          </div>

          {/* Columna derecha — texto + valores */}
          <div>
            <h3
              className="nos-about-reveal headline-display text-white"
              style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
            >
              Más de <span className="text-red-500">10 años</span> de
              Experiencia
            </h3>
            <p className="nos-about-reveal mt-5 max-w-md text-base leading-relaxed text-muted">
              Estamos ubicados en Av. Vicuña Mackenna Oriente #8264, La Florida.
              Sector sur de la Región Metropolitana.
            </p>

            {/* Valores con check */}
            <ul className="nos-about-reveal mt-8 space-y-4">
              {VALORES.map((v) => (
                <li key={v.texto} className="flex items-start gap-3">
                  <IconoCheck />
                  <span className="text-[15px] font-light text-white/90">
                    {v.texto}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Equipo ───────────────────────────────────────────────────── */}
      <div className="bg-surface py-24">
        <div ref={teamRef} className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="nos-team-reveal label-mono mb-3">Nuestro equipo</p>
          <h3
            className="nos-team-reveal headline-display text-white"
            style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
          >
            Las personas detrás de{" "}
            <span className="text-red-500">Red Motos</span>
          </h3>

          <div className="nos-team-reveal mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3">
            {EQUIPO.map((p, i) => (
              <motion.div
                key={p.nombre}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
                className="group text-center"
              >
                <div className="overflow-hidden rounded-xl">
                  <img
                    src={p.foto}
                    alt={p.nombre}
                    width={400}
                    height={400}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 font-display text-xl font-bold uppercase tracking-wide text-white">
                  {p.nombre}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Instagram ────────────────────────────────────────────────── */}
      <div className="bg-black py-24">
        <div ref={igRef} className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="nos-ig-reveal flex flex-col items-center text-center">
            <p className="label-mono mb-3">Redes sociales</p>
            <h3
              className="headline-display text-white"
              style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
            >
              Síguenos en Instagram
            </h3>
            <a
              href="https://www.instagram.com/redmotoschile/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-lg font-semibold text-red-500 transition-colors duration-200 hover:text-red-400"
            >
              <IconoInstagram />
              @redmotoschile
            </a>
          </div>

          <div className="nos-ig-reveal mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {GALERIA_IG.map((g, i) => (
              <motion.a
                key={g.link}
                href={g.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
                className="group overflow-hidden rounded-lg"
              >
                <img
                  src={g.img}
                  alt={`Red Motos en Instagram — publicación ${i + 1}`}
                  width={400}
                  height={400}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
