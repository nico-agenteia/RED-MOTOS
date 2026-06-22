"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { cuotaFrancesa, formatCLP } from "@/lib/utils";
import { linkWhatsApp, TASA_MENSUAL_REFERENCIAL } from "@/lib/config";
import type { OpcionesMoto, ResultadoCuota } from "@/lib/autofin";
import type { Moto } from "@/lib/tipos";
import { codigosAutofin } from "@/lib/autofin-codigos";
import ModalSolicitud from "@/components/ModalSolicitud";

const PLAZOS_FALLBACK = [12, 18, 24, 36, 48];
const PIE_MIN_FB = 0;
const PIE_MAX_FB = 50;
const PIE_STEP_PCT = 5;

type EstadoCuota = "idle" | "cargando" | "ok" | "error";

const formatPct = (n: number) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: 2 });

export default function SimuladorCuotas() {
  const [opciones, setOpciones] = useState<OpcionesMoto | null>(null);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [motoId, setMotoId] = useState<string>("");
  const [piePct, setPiePct] = useState(20);
  const [plazo, setPlazo] = useState(24);
  const [cuotaReal, setCuotaReal] = useState<ResultadoCuota | null>(null);
  const [estado, setEstado] = useState<EstadoCuota>("idle");
  const [solicitudSrc, setSolicitudSrc] = useState<string | null>(null);
  const [cargandoSolicitud, setCargandoSolicitud] = useState(false);

  const cuotaRef = useRef<HTMLSpanElement>(null);
  const cuotaAnimada = useRef({ val: 0 });

  const plazos = opciones?.plazos.length ? opciones.plazos : PLAZOS_FALLBACK;
  const pieMin = opciones?.pieMinPct ?? PIE_MIN_FB;
  const pieMax = opciones?.pieMaxPct ?? PIE_MAX_FB;

  const motoSeleccionada = motos.find((m) => m.id === motoId) ?? null;
  const valor = motoSeleccionada
    ? (motoSeleccionada.precioBono ?? motoSeleccionada.precioLista)
    : 0;

  const pie = useMemo(() => Math.round((valor * piePct) / 100), [valor, piePct]);
  const capital = valor - pie;
  const cuotaLocal = useMemo(
    () => (capital > 0 ? cuotaFrancesa(capital, TASA_MENSUAL_REFERENCIAL, plazo) : 0),
    [capital, plazo],
  );

  const real = cuotaReal !== null && estado !== "error";
  const cuotaNum = real ? cuotaReal!.valorCuota : cuotaLocal;

  // 1) Cargar motos del catálogo.
  useEffect(() => {
    fetch("/api/motos")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("motos"))))
      .then((d) => {
        const lista: Moto[] = d.motos ?? [];
        lista.sort((a, b) => {
          const cmp = a.marca.localeCompare(b.marca);
          return cmp !== 0 ? cmp : a.modelo.localeCompare(b.modelo);
        });
        setMotos(lista);
      })
      .catch(() => setMotos([]));
  }, []);

  // 2) Cargar opciones Autofin.
  useEffect(() => {
    let activo = true;
    fetch("/api/autofin/config")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("config"))))
      .then((o: OpcionesMoto) => {
        if (!activo) return;
        setOpciones(o);
        setPiePct((p) => Math.min(Math.max(p, o.pieMinPct), o.pieMaxPct));
        setPlazo((pl) =>
          o.plazos.includes(pl)
            ? pl
            : o.plazos.includes(24)
              ? 24
              : (o.plazos[Math.floor(o.plazos.length / 2)] ?? pl),
        );
      })
      .catch(() => {
        if (activo) setOpciones(null);
      });
    return () => { activo = false; };
  }, []);

  // 3) Cuota real (Autofin).
  useEffect(() => {
    if (!opciones || !motoSeleccionada || capital <= 0) {
      setCuotaReal(null);
      if (motoSeleccionada && capital <= 0) setEstado("error");
      return;
    }
    setEstado("cargando");
    const id = setTimeout(() => {
      fetch("/api/autofin/cuota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precio: valor, montoPie: pie, plazo }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("cuota"))))
        .then((d: ResultadoCuota) => { setCuotaReal(d); setEstado("ok"); })
        .catch(() => { setCuotaReal(null); setEstado("error"); });
    }, 450);
    return () => clearTimeout(id);
  }, [opciones, motoSeleccionada, valor, pie, plazo, capital]);

  // Count-up animado.
  useEffect(() => {
    const span = cuotaRef.current;
    if (!span) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir) {
      span.textContent = formatCLP(cuotaNum);
      cuotaAnimada.current.val = cuotaNum;
      return;
    }
    const tween = gsap.to(cuotaAnimada.current, {
      val: cuotaNum,
      duration: 0.5,
      ease: "power3.out",
      onUpdate: () => { span.textContent = formatCLP(cuotaAnimada.current.val); },
    });
    return () => { tween.kill(); };
  }, [cuotaNum]);

  const alCambiarPie = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPiePct(Number(e.target.value)),
    [],
  );

  const fillPie = pieMax > pieMin ? ((piePct - pieMin) / (pieMax - pieMin)) * 100 : 0;

  const nombreMoto = motoSeleccionada
    ? `${motoSeleccionada.marca} ${motoSeleccionada.modelo}`
    : "";

  const mensajeWsp = motoSeleccionada
    ? `Hola! Simulé un financiamiento en la web de Red Motos para la ${nombreMoto} (${formatCLP(valor)}): pie de ${formatCLP(pie)} (${piePct}%), ${plazo} cuotas de ${formatCLP(cuotaNum)}${real ? ` (CAE ${formatPct(cuotaReal!.cae)}%)` : ""}. ¿Me pueden ayudar a concretarlo?`
    : "";

  const payloadLead = (via: "iframe" | "whatsapp") => ({
    origen: "simulador" as const,
    nombre: nombreMoto || undefined,
    presupuesto: formatCLP(valor),
    score: "warm" as const,
    payload: {
      motoId: motoSeleccionada?.id,
      moto: nombreMoto,
      valor,
      pie,
      piePct,
      plazo,
      cuota: cuotaNum,
      cuotaReal: real,
      cae: real ? cuotaReal!.cae : null,
      totalCredito: real ? cuotaReal!.totalCredito : null,
      via,
    },
  });

  const registrarLeadWsp = () => {
    void fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadLead("whatsapp")),
    }).catch(() => {});
  };

  const abrirSolicitud = async () => {
    if (!opciones || cargandoSolicitud) return;
    setCargandoSolicitud(true);
    let leadId = "";
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadLead("iframe")),
      });
      if (r.ok) leadId = (await r.json())?.leadId ?? "";
    } catch { /* sin leadId igual abrimos */ }

    const { spiderUrl, codSpider, brand, model, year } = opciones.iframe;
    // Códigos de la moto elegida; si no está mapeada, usa el de homologación.
    const codigos = motoSeleccionada ? codigosAutofin(motoSeleccionada) : null;
    const params = new URLSearchParams({
      businessType: "2",
      vehicleStatus: "1",
      isMoto: "true",
      brand: String(codigos?.brand ?? brand),
      model: String(codigos?.model ?? model),
      year: String(year),
      price: String(valor),
    });
    if (leadId) params.set("idExterno", leadId);
    setSolicitudSrc(`${spiderUrl}/${codSpider}?${params.toString()}`);
    setCargandoSolicitud(false);
  };

  // Agrupar motos por marca para el select.
  const marcas = useMemo(() => {
    const map = new Map<string, Moto[]>();
    for (const m of motos) {
      const lista = map.get(m.marca) ?? [];
      lista.push(m);
      map.set(m.marca, lista);
    }
    return Array.from(map.entries());
  }, [motos]);

  const hayMoto = motoSeleccionada !== null;

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
          {/* ── Controles ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-8">
            {/* Selector de moto */}
            <div>
              <label
                htmlFor="select-moto"
                className="label-mono mb-2 block !text-[11px]"
              >
                Selecciona tu moto
              </label>
              <div className="relative">
                <select
                  id="select-moto"
                  value={motoId}
                  onChange={(e) => setMotoId(e.target.value)}
                  className="min-h-[52px] w-full appearance-none rounded-lg border border-line bg-surface px-4 pr-10 font-display text-base font-bold text-white transition-colors duration-200 focus:border-red-500 focus:outline-none"
                >
                  <option value="" disabled>
                    — Elige una moto —
                  </option>
                  {marcas.map(([marca, lista]) => (
                    <optgroup key={marca} label={marca}>
                      {lista.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.modelo} · {formatCLP(m.precioBono ?? m.precioLista)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {hayMoto && (
                <p className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted">Precio</span>
                  <span className="font-display text-2xl font-bold text-white">
                    {formatCLP(valor)}
                  </span>
                </p>
              )}
            </div>

            {/* Pie inicial */}
            <div className={hayMoto ? "" : "pointer-events-none opacity-30"}>
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
                min={pieMin}
                max={pieMax}
                step={PIE_STEP_PCT}
                value={piePct}
                onChange={alCambiarPie}
                className="slider-rojo"
                style={{ "--fill": `${fillPie}%` } as React.CSSProperties}
                aria-valuetext={`${piePct} por ciento — ${formatCLP(pie)}`}
              />
            </div>

            {/* Plazos */}
            <div className={hayMoto ? "" : "pointer-events-none opacity-30"}>
              <p className="label-mono mb-3 !text-[11px]">Plazo en cuotas</p>
              <div
                role="radiogroup"
                aria-label="Plazo en cuotas"
                className="flex flex-wrap gap-2"
              >
                {plazos.map((p) => (
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

          {/* ── Resultado ─────────────────────────────────────────── */}
          <div className="flex flex-col justify-center rounded-xl border border-line bg-surface p-6 md:p-8">
            {!hayMoto ? (
              <div className="py-8 text-center">
                <p className="text-4xl" aria-hidden="true">🏍️</p>
                <p className="mt-4 text-base text-muted">
                  Elige una moto del catálogo para ver tu cuota mensual estimada
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="label-mono !text-[11px]">Tu cuota mensual</p>
                  {real && (
                    <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                      Cuota real
                    </span>
                  )}
                </div>
                <p
                  className="mt-2 font-display font-extrabold text-red-500 transition-opacity duration-200"
                  style={{
                    fontSize: "clamp(48px, 7vw, 72px)",
                    lineHeight: 1,
                    opacity: estado === "cargando" ? 0.55 : 1,
                  }}
                >
                  <span ref={cuotaRef}>{formatCLP(cuotaNum)}</span>
                </p>

                <p className="mt-2 text-sm text-muted">{nombreMoto}</p>

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
                  {real && (
                    <>
                      <div>
                        <dt className="label-mono !text-[11px]">CAE</dt>
                        <dd className="font-display text-xl font-bold text-white">
                          {formatPct(cuotaReal!.cae)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="label-mono !text-[11px]">Costo total crédito</dt>
                        <dd className="font-display text-xl font-bold text-white">
                          {formatCLP(cuotaReal!.totalCredito)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>

                <p className="label-mono mt-6 !text-[10px] !leading-relaxed">
                  {real
                    ? "Cuota, CAE y costo total entregados por Autofin. Valores referenciales sujetos a evaluación crediticia."
                    : estado === "error"
                      ? "No pudimos conectar con Autofin: mostramos un cálculo referencial. Las condiciones finales las define la tienda."
                      : "[REFERENCIAL] Tasa y condiciones finales las define la tienda. Esta simulación es solo orientativa."}
                </p>

                {opciones ? (
                  <>
                    <motion.button
                      type="button"
                      onClick={abrirSolicitud}
                      disabled={cargandoSolicitud}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:opacity-60"
                    >
                      {cargandoSolicitud ? "Abriendo…" : "Solicitar financiamiento →"}
                    </motion.button>
                    <a
                      href={linkWhatsApp(mensajeWsp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={registrarLeadWsp}
                      className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md border border-line px-6 text-sm font-semibold text-muted transition-colors duration-200 hover:border-white/25 hover:text-white"
                    >
                      Prefiero cotizar por WhatsApp
                    </a>
                  </>
                ) : (
                  <motion.a
                    href={linkWhatsApp(mensajeWsp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={registrarLeadWsp}
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                  >
                    Cotizar financiamiento →
                  </motion.a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ModalSolicitud src={solicitudSrc} onClose={() => setSolicitudSrc(null)} />
    </section>
  );
}
