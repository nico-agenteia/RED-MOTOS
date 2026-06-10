"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { cuotaFrancesa, formatCLP } from "@/lib/utils";
import { linkWhatsApp, TASA_MENSUAL_REFERENCIAL } from "@/lib/config";

const VALOR_MIN = 500_000;
const VALOR_MAX = 20_000_000;
const VALOR_STEP = 100_000;
const PIE_MAX_PCT = 50;
const PIE_STEP_PCT = 5;
const PLAZOS = [12, 18, 24, 36, 48] as const;

export default function SimuladorCuotas() {
  const [valor, setValor] = useState(3_500_000);
  const [piePct, setPiePct] = useState(20);
  const [plazo, setPlazo] = useState<(typeof PLAZOS)[number]>(24);

  const cuotaRef = useRef<HTMLSpanElement>(null);
  const cuotaAnimada = useRef({ val: 0 });

  const pie = useMemo(
    () => Math.round((valor * piePct) / 100),
    [valor, piePct],
  );
  const capital = valor - pie;
  const cuota = useMemo(
    () => cuotaFrancesa(capital, TASA_MENSUAL_REFERENCIAL, plazo),
    [capital, plazo],
  );

  // Count-up animado de la cuota (GSAP) cada vez que cambia.
  useEffect(() => {
    const span = cuotaRef.current;
    if (!span) return;

    const reducirMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducirMotion) {
      span.textContent = formatCLP(cuota);
      cuotaAnimada.current.val = cuota;
      return;
    }

    const tween = gsap.to(cuotaAnimada.current, {
      val: cuota,
      duration: 0.5,
      ease: "power3.out",
      onUpdate: () => {
        span.textContent = formatCLP(cuotaAnimada.current.val);
      },
    });
    return () => {
      tween.kill();
    };
  }, [cuota]);

  const alCambiarValor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValor(Number(e.target.value)),
    [],
  );
  const alCambiarPie = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPiePct(Number(e.target.value)),
    [],
  );

  const fillValor = ((valor - VALOR_MIN) / (VALOR_MAX - VALOR_MIN)) * 100;
  const fillPie = (piePct / PIE_MAX_PCT) * 100;

  const mensajeWsp = `Hola! Simulé un financiamiento en la web de Red Motos: moto de ${formatCLP(valor)}, pie de ${formatCLP(pie)} (${piePct}%), ${plazo} cuotas de aprox. ${formatCLP(cuota)}. ¿Me pueden ayudar a concretarlo?`;

  return (
    <section
      id="financiamiento"
      aria-label="Simulador de cuotas"
      className="bg-surface-2 py-24"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <p className="label-mono mb-3">Financiamiento</p>
        <h2
          className="headline-display text-white"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Simula tu cuota
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Controles */}
          <div className="flex flex-col gap-8">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="slider-valor" className="label-mono !text-[11px]">
                  Valor de la moto
                </label>
                <span className="font-display text-2xl font-bold text-white">
                  {formatCLP(valor)}
                </span>
              </div>
              <input
                id="slider-valor"
                type="range"
                min={VALOR_MIN}
                max={VALOR_MAX}
                step={VALOR_STEP}
                value={valor}
                onChange={alCambiarValor}
                className="slider-rojo"
                style={{ "--fill": `${fillValor}%` } as React.CSSProperties}
                aria-valuetext={formatCLP(valor)}
              />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="slider-pie" className="label-mono !text-[11px]">
                  Pie inicial ({piePct}%)
                </label>
                <span className="font-display text-2xl font-bold text-white">
                  {formatCLP(pie)}
                </span>
              </div>
              <input
                id="slider-pie"
                type="range"
                min={0}
                max={PIE_MAX_PCT}
                step={PIE_STEP_PCT}
                value={piePct}
                onChange={alCambiarPie}
                className="slider-rojo"
                style={{ "--fill": `${fillPie}%` } as React.CSSProperties}
                aria-valuetext={`${piePct} por ciento — ${formatCLP(pie)}`}
              />
            </div>

            <div>
              <p className="label-mono mb-3 !text-[11px]">Plazo en cuotas</p>
              <div
                role="radiogroup"
                aria-label="Plazo en cuotas"
                className="flex flex-wrap gap-2"
              >
                {PLAZOS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={plazo === p}
                    onClick={() => setPlazo(p)}
                    className={`min-h-[44px] min-w-[64px] rounded-md border text-sm font-semibold transition-colors duration-200 ${
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

          {/* Resultado */}
          <div className="flex flex-col justify-center rounded-xl border border-line bg-surface p-8">
            <p className="label-mono !text-[11px]">Tu cuota mensual aprox.</p>
            <p
              className="mt-2 font-display font-extrabold text-red-500"
              style={{ fontSize: "clamp(48px, 7vw, 72px)", lineHeight: 1 }}
            >
              <span ref={cuotaRef}>{formatCLP(cuota)}</span>
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6">
              <div>
                <dt className="label-mono !text-[11px]">Monto a financiar</dt>
                <dd className="font-display text-xl font-bold text-white">
                  {formatCLP(capital)}
                </dd>
              </div>
              <div>
                <dt className="label-mono !text-[11px]">Plazo</dt>
                <dd className="font-display text-xl font-bold text-white">
                  {plazo} cuotas
                </dd>
              </div>
            </dl>
            <p className="label-mono mt-6 !text-[10px] !leading-relaxed">
              [REFERENCIAL] Tasa y condiciones finales las define la tienda.
              Esta simulación es solo orientativa.
            </p>
            <motion.a
              href={linkWhatsApp(mensajeWsp)}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
            >
              Cotizar financiamiento →
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
