"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CATALOGO, MARCAS_CATALOGO, precioVigente } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import type { Moto } from "@/lib/tipos";

/* ── Ease personalizado igual al resto del design system ── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function MegaMenuMotos({ abierto, onCerrar }: Props) {
  const reducedMotion = useReducedMotion();

  /* Estado de preview: default primera moto del catálogo (Royal Enfield) */
  const defaultMoto = CATALOGO.find((m) => m.marca === "Royal Enfield") ?? CATALOGO[0];
  const [motoActiva, setMotoActiva] = useState<Moto>(defaultMoto);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  /* Mensaje WhatsApp específico de la moto activa */
  const wspMoto = linkWhatsApp(
    `Hola! Quiero cotizar la ${motoActiva.marca} ${motoActiva.modelo}. ¿Me pueden dar información?`,
  );

  return (
    /* Solo desktop — oculto en mobile */
    <div className="hidden lg:block">
      <AnimatePresence>
        {abierto && (
          <>
            {/* Scrim exterior — cierra al click */}
            <motion.div
              key="megamenu-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.2,
              }}
              onClick={onCerrar}
              aria-hidden="true"
              className="fixed inset-0 top-[56px] z-40 bg-black/40"
            />

            {/* Panel principal */}
            <motion.div
              key="megamenu-panel"
              role="dialog"
              aria-label="Catálogo de motos"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.38,
                ease: EASE_OUT_EXPO,
              }}
              className="absolute inset-x-0 top-full z-50 overflow-hidden border-b border-line bg-surface/95 backdrop-blur-xl"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-[1fr_420px] gap-0 px-4 py-8 md:px-8">
                {/* ── IZQUIERDA: Columnas por marca ── */}
                <div className="flex flex-wrap gap-x-10 gap-y-8 pr-8">
                  {MARCAS_CATALOGO.map((marca) => {
                    const motos = CATALOGO.filter((m) => m.marca === marca);
                    if (motos.length === 0) return null;
                    return (
                      <div key={marca} className="min-w-[140px]">
                        {/* Título de marca */}
                        <p className="label-mono mb-3 text-muted">{marca}</p>
                        {/* Lista de modelos */}
                        <ul className="flex flex-col gap-1">
                          {motos.map((moto) => (
                            <li key={moto.id}>
                              <a
                                href={`/modelo/${moto.id}`}
                                onMouseEnter={() => setMotoActiva(moto)}
                                onClick={onCerrar}
                                className={`group relative inline-block py-1 text-sm font-medium transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 ${
                                  motoActiva.id === moto.id
                                    ? "text-white after:scale-x-100"
                                    : "text-muted"
                                }`}
                              >
                                {moto.modelo}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* ── DERECHA: Preview de la moto activa ── */}
                <div className="flex flex-col items-start justify-between gap-6 border-l border-line pl-8">
                  {/* Imagen con swap animado */}
                  <div className="flex w-full items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={motoActiva.id}
                        src={motoActiva.img}
                        alt={`${motoActiva.marca} ${motoActiva.modelo}`}
                        initial={
                          reducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.96 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        exit={
                          reducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 1.02 }
                        }
                        transition={{
                          duration: reducedMotion ? 0 : 0.28,
                          ease: EASE_OUT_EXPO,
                        }}
                        className="w-full max-w-[460px] object-contain drop-shadow-[0_24px_60px_rgba(226,35,26,0.22)]"
                      />
                    </AnimatePresence>
                  </div>

                  {/* Info de la moto activa */}
                  <div className="w-full">
                    {/* Marca + segmento */}
                    <p className="label-mono mb-2 text-muted">
                      {motoActiva.marca} · {motoActiva.segmento} · {motoActiva.cc} cc
                    </p>

                    {/* Nombre modelo */}
                    <h3 className="headline-display mb-3 text-3xl text-white">
                      {motoActiva.modelo}
                    </h3>

                    {/* Precio */}
                    <div className="mb-5 flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-white">
                        {formatCLP(precioVigente(motoActiva))}
                      </span>
                      {motoActiva.precioBono !== null && (
                        <span className="text-sm text-muted line-through">
                          {formatCLP(motoActiva.precioLista)}
                        </span>
                      )}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`/modelo/${motoActiva.id}`}
                        onClick={onCerrar}
                        className="inline-flex min-h-[44px] items-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                      >
                        Ver {motoActiva.modelo}
                      </a>
                      <a
                        href={wspMoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onCerrar}
                        className="inline-flex min-h-[44px] items-center rounded-md border border-line px-5 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/20 hover:bg-white/5"
                      >
                        Cotizar →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
