"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CATALOGO, precioVigente } from "@/lib/catalogo";
import { capitalDesdeQuota, cuotaFrancesa, formatCLP } from "@/lib/utils";
import { TASA_MENSUAL_REFERENCIAL } from "@/lib/config";

const CUOTA_MIN = 50_000;
const CUOTA_MAX = 600_000;
const CUOTA_STEP = 10_000;
const CUOTA_DEFAULT = 150_000;
const PLAZOS = [12, 18, 24, 36, 48];
const PIE_PCT = 30;
const MAX_RESULTADOS = 12;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export default function BuscadorPorCuota() {
  const [cuotaDeseada, setCuotaDeseada] = useState(CUOTA_DEFAULT);
  const [plazo, setPlazo] = useState(36);

  const alCambiarCuota = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCuotaDeseada(Number(e.target.value)),
    [],
  );

  const fillCuota = ((cuotaDeseada - CUOTA_MIN) / (CUOTA_MAX - CUOTA_MIN)) * 100;

  const { motosQueCalzan, precioMaximo } = useMemo(() => {
    const capitalMax = capitalDesdeQuota(cuotaDeseada, TASA_MENSUAL_REFERENCIAL, plazo);
    const precioMax = Math.round(capitalMax / (1 - PIE_PCT / 100));

    const filtradas = CATALOGO
      .filter((m) => precioVigente(m) <= precioMax)
      .sort((a, b) => precioVigente(b) - precioVigente(a));

    return { motosQueCalzan: filtradas.slice(0, MAX_RESULTADOS), precioMaximo: precioMax };
  }, [cuotaDeseada, plazo]);

  const totalDisponibles = useMemo(() => {
    const capitalMax = capitalDesdeQuota(cuotaDeseada, TASA_MENSUAL_REFERENCIAL, plazo);
    const precioMax = Math.round(capitalMax / (1 - PIE_PCT / 100));
    return CATALOGO.filter((m) => precioVigente(m) <= precioMax).length;
  }, [cuotaDeseada, plazo]);

  return (
    <section id="buscar-por-cuota" aria-label="Buscar moto por cuota mensual" className="bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <p className="label-mono mb-3">Descubre tu moto</p>
        <h2
          className="headline-display text-white"
          style={{ fontSize: "clamp(32px, 5vw, 64px)" }}
        >
          ¿Cuánto puedes pagar al mes?
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Dinos tu cuota ideal y te mostramos las motos que caben en tu presupuesto.
          Sin letra chica, sin sorpresas.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[400px_1fr]">
          {/* Controles */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-line bg-surface-2 p-6">
              <div className="mb-5">
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="slider-cuota-deseada" className="label-mono !text-[11px]">
                    Cuota mensual
                  </label>
                  <span className="font-display text-2xl font-bold text-red-500">
                    {formatCLP(cuotaDeseada)}
                  </span>
                </div>
                <input
                  id="slider-cuota-deseada"
                  type="range"
                  min={CUOTA_MIN}
                  max={CUOTA_MAX}
                  step={CUOTA_STEP}
                  value={cuotaDeseada}
                  onChange={alCambiarCuota}
                  className="slider-rojo"
                  style={{ "--fill": `${fillCuota}%` } as React.CSSProperties}
                  aria-valuetext={formatCLP(cuotaDeseada)}
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>{formatCLP(CUOTA_MIN)}</span>
                  <span>{formatCLP(CUOTA_MAX)}</span>
                </div>
              </div>

              <div>
                <p className="label-mono mb-2.5 !text-[11px]">Plazo en cuotas</p>
                <div role="radiogroup" aria-label="Plazo en cuotas" className="flex flex-wrap gap-2">
                  {PLAZOS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={plazo === p}
                      onClick={() => setPlazo(p)}
                      className={`min-h-[44px] min-w-[56px] rounded-md border text-sm font-semibold transition-colors duration-200 ${
                        plazo === p
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-line bg-surface text-muted hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="rounded-xl border border-line bg-surface-2 p-6">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="label-mono !text-[10px]">Pie estimado</dt>
                  <dd className="font-display text-lg font-bold text-white">{PIE_PCT}%</dd>
                </div>
                <div>
                  <dt className="label-mono !text-[10px]">Precio máx. de moto</dt>
                  <dd className="font-display text-lg font-bold text-white">{formatCLP(precioMaximo)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="label-mono !text-[10px]">Motos disponibles</dt>
                  <dd className="font-display text-3xl font-extrabold text-red-500">
                    {totalDisponibles}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-[10px] leading-relaxed text-muted">
                Cálculo referencial con tasa mensual de {(TASA_MENSUAL_REFERENCIAL * 100).toFixed(1)}% y pie de {PIE_PCT}%.
                Las condiciones finales las define la tienda.
              </p>
            </div>
          </div>

          {/* Resultados */}
          <div>
            <AnimatePresence mode="wait">
              {motosQueCalzan.length > 0 ? (
                <motion.div
                  key={`${cuotaDeseada}-${plazo}`}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {motosQueCalzan.map((moto) => {
                    const pv = precioVigente(moto);
                    const pieM = Math.round(pv * PIE_PCT / 100);
                    const cuotaEst = cuotaFrancesa(pv - pieM, TASA_MENSUAL_REFERENCIAL, plazo);

                    return (
                      <motion.div key={moto.id} variants={fadeUp} layout>
                        <Link
                          href={`/modelo/${moto.id}`}
                          className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface-2 transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                        >
                          <div className="relative flex aspect-[4/3] items-center justify-center bg-[hsl(0,0%,7%)] overflow-hidden">
                            <img
                              src={moto.img}
                              alt={`${moto.marca} ${moto.modelo}`}
                              width={280}
                              height={210}
                              loading="lazy"
                              className="h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                            />
                            {moto.precioBono !== null && (
                              <span className="absolute left-2.5 top-2.5 rounded-sm bg-red-500 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-white">
                                Descuento
                              </span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <p className="label-mono !text-[9px] mb-0.5">{moto.marca}</p>
                            <h3 className="font-display text-base font-bold uppercase text-white leading-tight">
                              {moto.modelo}
                            </h3>
                            <p className="mt-1 text-[11px] text-muted">{moto.cc} cc · {moto.segmento}</p>

                            <div className="mt-auto pt-3 border-t border-line/50">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[11px] text-muted">Cuota est.</span>
                                <span className="font-display text-lg font-extrabold text-red-500">
                                  {formatCLP(cuotaEst)}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between mt-0.5">
                                <span className="text-[10px] text-muted">Precio</span>
                                <span className="text-[12px] font-semibold text-white">
                                  {formatCLP(pv)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-2 py-20 text-center"
                >
                  <p className="font-display text-xl font-bold text-white">
                    Sin resultados para esa cuota
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-muted">
                    Intenta subir la cuota mensual o elegir un plazo más largo para ver más opciones.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {totalDisponibles > MAX_RESULTADOS && (
              <p className="mt-4 text-center text-sm text-muted">
                Mostrando {MAX_RESULTADOS} de {totalDisponibles} motos disponibles.{" "}
                <a href="/#catalogo" className="text-red-400 hover:text-red-300 transition-colors">
                  Ver catálogo completo
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
