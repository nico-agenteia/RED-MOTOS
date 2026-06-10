"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATALOGO, MARCAS_CATALOGO } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import type { Moto } from "@/lib/tipos";

type Filtro = "Todos" | "Con descuento" | (typeof MARCAS_CATALOGO)[number];

/** Fondo sólido muteado por marca (familia oscura, estilo Zero). */
const TINTE_MARCA: Record<string, string> = {
  "Royal Enfield": "hsl(36, 30%, 8%)",
  Suzuki: "hsl(221, 60%, 7%)",
  Kymco: "hsl(152, 25%, 7%)",
  Keeway: "hsl(0, 0%, 9%)",
  Zontes: "hsl(270, 20%, 8%)",
  Voge: "hsl(200, 25%, 8%)",
  Cyclone: "hsl(10, 35%, 8%)",
};

function mensajeCotizacion(moto: Moto): string {
  return `Hola! Vengo de la web de Red Motos. Quiero cotizar la ${moto.marca} ${moto.modelo}. ¿Me pueden atender?`;
}

function CardMoto({ moto }: { moto: Moto }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group overflow-hidden rounded-xl border border-line bg-surface-2 transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      style={{ willChange: "transform" }}
    >
      {/* Foto sobre fondo sólido muteado de la marca */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{ backgroundColor: TINTE_MARCA[moto.marca] ?? "hsl(0,0%,9%)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"
        />
        <img
          src={moto.img}
          alt={`${moto.marca} ${moto.modelo}`}
          width={520}
          height={390}
          loading="lazy"
          className="relative h-full w-full object-contain p-6 transition-transform duration-300 ease-out-expo group-hover:scale-[1.04]"
        />
        {moto.precioBono !== null && (
          <span className="absolute left-4 top-4 rounded-sm bg-red-500 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white">
            Bono
          </span>
        )}
      </div>

      <div className="p-6">
        <p className="label-mono mb-1 !text-[11px]">{moto.marca}</p>
        <h3 className="font-display text-2xl font-bold uppercase text-white">
          {moto.modelo}
        </h3>

        {/* Specs número/label en 2 columnas */}
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <dt className="label-mono !text-[11px]">Cilindrada</dt>
            <dd className="font-display text-xl font-bold text-white">
              {moto.cc} cc
            </dd>
          </div>
          <div>
            <dt className="label-mono !text-[11px]">Segmento</dt>
            <dd className="font-display text-xl font-bold text-white">
              {moto.segmento}
            </dd>
          </div>
        </dl>

        {/* Precio: bono → lista tachada + final rojo */}
        <div className="mt-4 flex items-baseline gap-3">
          {moto.precioBono !== null ? (
            <>
              <span className="text-sm text-muted line-through">
                {formatCLP(moto.precioLista)}
              </span>
              <span className="font-display text-3xl font-extrabold text-red-500">
                {formatCLP(moto.precioBono)}
              </span>
            </>
          ) : (
            <span className="font-display text-3xl font-extrabold text-white">
              {formatCLP(moto.precioLista)}
            </span>
          )}
        </div>

        <motion.a
          href={linkWhatsApp(mensajeCotizacion(moto))}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-red-500 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
          aria-label={`Cotizar ${moto.marca} ${moto.modelo} por WhatsApp`}
        >
          Cotizar
        </motion.a>
      </div>
    </motion.article>
  );
}

export default function Catalogo() {
  const [filtro, setFiltro] = useState<Filtro>("Todos");

  const chips: Filtro[] = useMemo(
    () => ["Todos", ...MARCAS_CATALOGO, "Con descuento"],
    [],
  );

  const motos = useMemo(() => {
    if (filtro === "Todos") return CATALOGO;
    if (filtro === "Con descuento")
      return CATALOGO.filter((m) => m.precioBono !== null);
    return CATALOGO.filter((m) => m.marca === filtro);
  }, [filtro]);

  return (
    <section id="catalogo" aria-label="Catálogo de motos" className="bg-black py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="label-mono mb-3">
          {CATALOGO.length} modelos · {MARCAS_CATALOGO.length} marcas · stock real
        </p>
        <h2
          className="headline-display text-white"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Catálogo completo
        </h2>

        {/* Filtros sticky */}
        <div className="sticky top-[72px] z-20 -mx-4 mt-8 overflow-x-auto bg-black/85 px-4 py-4 backdrop-blur-md md:-mx-8 md:px-8">
          <div
            className="flex w-max gap-2"
            role="group"
            aria-label="Filtrar catálogo por marca"
          >
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setFiltro(chip)}
                aria-pressed={filtro === chip}
                className={`min-h-[44px] whitespace-nowrap rounded-full border px-5 text-sm font-medium transition-colors duration-200 ${
                  filtro === chip
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-line bg-surface text-muted hover:border-white/25 hover:text-white"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Grid con layout animation al filtrar */}
        <motion.div
          layout
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {motos.map((moto) => (
              <CardMoto key={moto.id} moto={moto} />
            ))}
          </AnimatePresence>
        </motion.div>

        {motos.length === 0 && (
          <p className="mt-12 text-center text-muted">
            No hay modelos con ese filtro por ahora. Escríbenos por WhatsApp y
            te conseguimos la moto que buscas.
          </p>
        )}
      </div>
    </section>
  );
}
