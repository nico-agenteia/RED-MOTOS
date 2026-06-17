"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { MOTOS_ROYAL_ENFIELD } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import type { Moto } from "@/lib/tipos";

gsap.registerPlugin(ScrollTrigger);

/** Badge co-brand circular vintage: RED MOTOS · PUNTO OFICIAL · ROYAL ENFIELD */
function BadgeCoBrand() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      role="img"
      aria-label="Sello Red Motos punto oficial Royal Enfield"
      className="shrink-0"
    >
      <circle cx="70" cy="70" r="66" fill="#F5EDD8" />
      <circle
        cx="70"
        cy="70"
        r="62"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="2"
      />
      <circle
        cx="70"
        cy="70"
        r="44"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1"
      />
      <defs>
        <path
          id="badge-circulo-texto"
          d="M 70,70 m -53,0 a 53,53 0 1,1 106,0 a 53,53 0 1,1 -106,0"
        />
      </defs>
      <text
        fontSize="10.5"
        fontFamily="var(--font-mono), monospace"
        letterSpacing="2.5"
        fill="#1A1208"
        fontWeight="500"
      >
        <textPath href="#badge-circulo-texto" startOffset="0%">
          RED MOTOS · PUNTO OFICIAL · ROYAL ENFIELD ·
        </textPath>
      </text>
      {/* Marco Red Motos al centro del sello */}
      <text
        x="70"
        y="62"
        textAnchor="middle"
        fontSize="13"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="800"
        fill="#C8102E"
        letterSpacing="1"
      >
        RED MOTOS
      </text>
      <line x1="48" y1="70" x2="92" y2="70" stroke="#C9A84C" strokeWidth="1" />
      <text
        x="70"
        y="86"
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono), monospace"
        fill="#1A1208"
        letterSpacing="1.5"
      >
        DESDE 1901
      </text>
    </svg>
  );
}

function CardRE({ moto, indice }: { moto: Moto; indice: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        delay: indice * 0.12,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group overflow-hidden rounded-xl border border-re-gold/25 bg-[#1A1208] transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
    >
      <Link
        href={`/modelo/${moto.id}`}
        aria-label={`Ver ficha de Royal Enfield ${moto.modelo}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-re-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1208]"
      >
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-b from-[#241a0c] to-[#1A1208]">
          <img
            src={moto.img}
            alt={`Royal Enfield ${moto.modelo}`}
            width={520}
            height={390}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
          />
          {moto.precioBono !== null && (
            <span className="absolute left-4 top-4 rounded-sm bg-re-red px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-re-cream">
              Descuento
            </span>
          )}
        </div>
        <div className="px-6 pt-6">
          <h3 className="font-display text-2xl font-bold uppercase text-re-cream transition-colors duration-200 group-hover:text-re-gold">
            {moto.modelo}
          </h3>
          <div className="mt-3 flex items-baseline gap-3">
            {moto.precioBono !== null ? (
              <>
                <span className="text-sm text-re-cream/50 line-through">
                  {formatCLP(moto.precioLista)}
                </span>
                <span className="font-display text-2xl font-extrabold text-re-gold">
                  {formatCLP(moto.precioBono)}
                </span>
              </>
            ) : (
              <span className="font-display text-2xl font-extrabold text-re-cream">
                {formatCLP(moto.precioLista)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-6 pb-6 pt-5">
        <motion.a
          href={linkWhatsApp(
            `Hola! Vengo de la web de Red Motos. Quiero cotizar la Royal Enfield ${moto.modelo}. ¿Me pueden atender?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-re-cream/50 text-sm font-semibold text-re-cream transition-colors duration-200 hover:border-re-cream hover:bg-re-cream/10"
          aria-label={`Cotizar Royal Enfield ${moto.modelo} por WhatsApp`}
        >
          Cotizar
        </motion.a>
      </div>
    </motion.article>
  );
}

export default function SalaRoyalEnfield() {
  const seccionRef = useRef<HTMLElement>(null);
  const barridoRef = useRef<HTMLDivElement>(null);

  // Barrido de paleta #0A0A0A → #1A1208 al entrar al viewport (y vuelta al salir).
  useEffect(() => {
    const reducirMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (reducirMotion) {
        gsap.set(barridoRef.current, { scaleX: 1 });
        return;
      }
      gsap.set(barridoRef.current, { scaleX: 0, transformOrigin: "left center" });
      ScrollTrigger.create({
        trigger: seccionRef.current,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () =>
          gsap.to(barridoRef.current, {
            scaleX: 1,
            duration: 0.9,
            ease: "power3.out",
          }),
        onLeaveBack: () =>
          gsap.to(barridoRef.current, {
            scaleX: 0,
            duration: 0.6,
            ease: "power3.in",
          }),
      });
    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="royal-enfield"
      ref={seccionRef}
      aria-label="Sala Royal Enfield"
      className="grain relative min-h-screen overflow-hidden bg-black py-24"
    >
      {/* Capa de barrido heritage */}
      <div
        ref={barridoRef}
        aria-hidden="true"
        className="absolute inset-0 bg-re-dark"
        style={{ willChange: "transform" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-12">
          <BadgeCoBrand />
          <div>
            <p className="label-mono mb-3 !text-re-gold">
              Zona insignia · Heritage
            </p>
            <h2
              className="headline-display text-re-cream"
              style={{ fontSize: "clamp(44px, 7vw, 80px)" }}
            >
              Pure Motorcycling
            </h2>
            <p className="mt-4 max-w-lg text-lg text-re-cream/70">
              Tradición y carácter desde 1901. Siente la diferencia.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOTOS_ROYAL_ENFIELD.map((moto, i) => (
            <CardRE key={moto.id} moto={moto} indice={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
