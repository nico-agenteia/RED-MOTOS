"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTOS_SUZUKI } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import type { Moto } from "@/lib/tipos";

gsap.registerPlugin(ScrollTrigger);

function CardSuzuki({ moto, indice }: { moto: Moto; indice: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        delay: indice * 0.06,
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group overflow-hidden rounded-xl border border-sz-blue/30 bg-sz-night transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(0,20,80,0.35)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-b from-[#001033] to-sz-night">
        <img
          src={moto.img}
          alt={`Suzuki ${moto.modelo}`}
          width={520}
          height={390}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out-expo group-hover:scale-[1.04]"
        />
        {moto.precioBono !== null && (
          <span className="absolute left-4 top-4 rounded-sm bg-sz-red px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white">
            Bono
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl font-bold uppercase italic text-white">
          {moto.modelo}
        </h3>
        <div className="mt-3 flex items-baseline gap-3">
          {moto.precioBono !== null ? (
            <>
              <span className="text-sm text-sz-silver/60 line-through">
                {formatCLP(moto.precioLista)}
              </span>
              <span className="font-display text-2xl font-extrabold text-sz-red">
                {formatCLP(moto.precioBono)}
              </span>
            </>
          ) : (
            <span className="font-display text-2xl font-extrabold text-white">
              {formatCLP(moto.precioLista)}
            </span>
          )}
        </div>
        <motion.a
          href={linkWhatsApp(
            `Hola! Vengo de la web de Red Motos. Quiero cotizar la Suzuki ${moto.modelo}. ¿Me pueden atender?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-sz-blue text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0050d6]"
          aria-label={`Cotizar Suzuki ${moto.modelo} por WhatsApp`}
        >
          Cotizar
        </motion.a>
      </div>
    </motion.article>
  );
}

export default function SalaSuzuki() {
  const seccionRef = useRef<HTMLElement>(null);
  const barridoRef = useRef<HTMLDivElement>(null);
  const lineasRef = useRef<HTMLDivElement>(null);

  // Barrido rápido #0A0A0A → #00051A + líneas de velocidad en entrada.
  useEffect(() => {
    const reducirMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      const lineas =
        lineasRef.current?.querySelectorAll<HTMLElement>(".linea-velocidad") ??
        [];

      if (reducirMotion) {
        gsap.set(barridoRef.current, { scaleX: 1 });
        gsap.set(lineas, { opacity: 1, x: 0 });
        return;
      }

      gsap.set(barridoRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(lineas, { opacity: 0, x: -160 });

      ScrollTrigger.create({
        trigger: seccionRef.current,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () => {
          gsap.to(barridoRef.current, {
            scaleX: 1,
            duration: 0.5,
            ease: "power4.out",
          });
          gsap.to(lineas, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.2,
          });
        },
        onLeaveBack: () => {
          gsap.to(barridoRef.current, {
            scaleX: 0,
            duration: 0.4,
            ease: "power3.in",
          });
          gsap.to(lineas, { opacity: 0, x: -160, duration: 0.3 });
        },
      });
    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="suzuki"
      ref={seccionRef}
      aria-label="Sala Suzuki"
      className="relative min-h-screen overflow-hidden border-t-2 border-sz-blue/30 bg-black py-24"
    >
      {/* Capa de barrido azul noche */}
      <div
        ref={barridoRef}
        aria-hidden="true"
        className="absolute inset-0 bg-sz-night"
        style={{ willChange: "transform" }}
      />

      {/* Líneas de velocidad diagonales */}
      <div
        ref={lineasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="linea-velocidad absolute left-[8%] top-[12%] block h-px w-[40%] rotate-[-18deg] bg-sz-blue/20" />
        <span className="linea-velocidad absolute left-[18%] top-[26%] block h-px w-[55%] rotate-[-18deg] bg-sz-blue/20" />
        <span className="linea-velocidad absolute left-[4%] top-[42%] block h-px w-[35%] rotate-[-18deg] bg-sz-blue/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        {/* Badge co-brand RED MOTOS × SUZUKI */}
        <p className="font-display text-lg font-extrabold uppercase tracking-wide">
          <span className="text-red-500">Red Motos</span>
          <span className="mx-2 text-white">×</span>
          <span className="text-[#2f6fe0]">Suzuki</span>
        </p>

        <h2
          className="headline-display mt-4 italic text-white"
          style={{ fontSize: "clamp(44px, 7vw, 80px)" }}
        >
          Way of Life
        </h2>
        <p className="mt-4 max-w-lg text-lg text-sz-silver/80">
          La herencia de la pista, en tus manos.
        </p>
        <p className="label-mono mt-3 !text-[#4a82e8]">
          ⸺ MotoAmerica Ecstar Racing Team
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOTOS_SUZUKI.map((moto, i) => (
            <CardSuzuki key={moto.id} moto={moto} indice={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
