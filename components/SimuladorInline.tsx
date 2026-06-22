"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { cuotaFrancesa, formatCLP } from "@/lib/utils";
import { linkWhatsApp, TASA_MENSUAL_REFERENCIAL } from "@/lib/config";
import type { OpcionesMoto, ResultadoCuota } from "@/lib/autofin";
import type { Marca } from "@/lib/tipos";
import { codigosAutofin } from "@/lib/autofin-codigos";
import ModalSolicitud from "@/components/ModalSolicitud";

const PLAZOS_FALLBACK = [12, 18, 24, 36, 48];
const PIE_MIN_FB = 0;
const PIE_MAX_FB = 50;
const PIE_STEP_PCT = 5;

type EstadoCuota = "idle" | "cargando" | "ok" | "error";

const formatPct = (n: number) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: 2 });

interface Props {
  precio: number;
  modeloNombre: string;
  marcaNombre: string;
  /** id de la moto del catálogo, para homologar el iFrame con su código Autofin. */
  motoId?: string;
}

export default function SimuladorInline({ precio, modeloNombre, marcaNombre, motoId }: Props) {
  const [opciones, setOpciones] = useState<OpcionesMoto | null>(null);
  const [piePct, setPiePct] = useState(30);
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

  const pie = useMemo(() => Math.round((precio * piePct) / 100), [precio, piePct]);
  const capital = precio - pie;
  const cuotaLocal = useMemo(
    () => cuotaFrancesa(capital, TASA_MENSUAL_REFERENCIAL, plazo),
    [capital, plazo],
  );

  const real = cuotaReal !== null && estado !== "error";
  const cuotaNum = real ? cuotaReal!.valorCuota : cuotaLocal;

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

  useEffect(() => {
    if (!opciones) return;
    if (capital <= 0) {
      setCuotaReal(null);
      setEstado("error");
      return;
    }
    setEstado("cargando");
    const id = setTimeout(() => {
      fetch("/api/autofin/cuota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precio, montoPie: pie, plazo }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("cuota"))))
        .then((d: ResultadoCuota) => {
          setCuotaReal(d);
          setEstado("ok");
        })
        .catch(() => {
          setCuotaReal(null);
          setEstado("error");
        });
    }, 450);
    return () => clearTimeout(id);
  }, [opciones, precio, pie, plazo, capital]);

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

  const mensajeWsp = `Hola! Me interesa la ${marcaNombre} ${modeloNombre} (${formatCLP(precio)}). Simulé un financiamiento: pie de ${formatCLP(pie)} (${piePct}%), ${plazo} cuotas de ${formatCLP(cuotaNum)}${real ? ` (CAE ${formatPct(cuotaReal!.cae)}%)` : ""}. ¿Me pueden ayudar?`;

  const payloadLead = (via: "iframe" | "whatsapp") => ({
    origen: "simulador-ficha" as const,
    presupuesto: formatCLP(precio),
    score: "warm" as const,
    payload: {
      modelo: `${marcaNombre} ${modeloNombre}`,
      valor: precio,
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
    } catch { /* sin leadId igual abrimos el iFrame */ }

    const { spiderUrl, codSpider, brand, model, year } = opciones.iframe;
    // Código de esta moto; si no está mapeada, usa el de homologación del server.
    const codigos = motoId
      ? codigosAutofin({ id: motoId, marca: marcaNombre as Marca })
      : null;
    const params = new URLSearchParams({
      businessType: "2",
      vehicleStatus: "1",
      isMoto: "true",
      brand: String(codigos?.brand ?? brand),
      model: String(codigos?.model ?? model),
      year: String(year),
      price: String(precio),
    });
    if (leadId) params.set("idExterno", leadId);
    setSolicitudSrc(`${spiderUrl}/${codSpider}?${params.toString()}`);
    setCargandoSolicitud(false);
  };

  return (
    <>
      <div className="rounded-xl border border-line bg-surface-2 p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Financia esta moto</p>
            <p className="text-[11px] text-muted">Cuota real con Autofin</p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-line/50 bg-surface px-4 py-3">
          <p className="label-mono !text-[10px] mb-0.5">Precio de la moto</p>
          <p className="font-display text-2xl font-extrabold text-white">{formatCLP(precio)}</p>
        </div>

        <div className="mb-5">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="pie-inline" className="label-mono !text-[10px]">
              Pie inicial ({piePct}%)
            </label>
            <span className="font-display text-lg font-bold text-white">{formatCLP(pie)}</span>
          </div>
          <input
            id="pie-inline"
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

        <div className="mb-6">
          <p className="label-mono mb-2.5 !text-[10px]">Plazo</p>
          <div role="radiogroup" aria-label="Plazo en cuotas" className="flex flex-wrap gap-1.5">
            {plazos.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={plazo === p}
                onClick={() => setPlazo(p)}
                className={`min-h-[40px] min-w-[52px] rounded-md border text-xs font-semibold transition-colors duration-200 ${
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

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center justify-between">
            <p className="label-mono !text-[10px]">Tu cuota mensual</p>
            {real && (
              <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-400">
                Real
              </span>
            )}
          </div>
          <p
            className="mt-1 font-display font-extrabold text-red-500 transition-opacity duration-200"
            style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              lineHeight: 1,
              opacity: estado === "cargando" ? 0.55 : 1,
            }}
          >
            <span ref={cuotaRef}>{formatCLP(cuotaNum)}</span>
          </p>

          {real && (
            <div className="mt-3 flex gap-4 text-[12px]">
              <span className="text-muted">
                CAE <span className="font-semibold text-white">{formatPct(cuotaReal!.cae)}%</span>
              </span>
              <span className="text-muted">
                Total <span className="font-semibold text-white">{formatCLP(cuotaReal!.totalCredito)}</span>
              </span>
            </div>
          )}
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-muted">
          {real
            ? "Valores entregados por Autofin. Sujetos a evaluacion crediticia."
            : "Calculo referencial. Las condiciones finales las define la tienda."}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          {opciones ? (
            <>
              <motion.button
                type="button"
                onClick={abrirSolicitud}
                disabled={cargandoSolicitud}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:opacity-60"
              >
                {cargandoSolicitud ? "Abriendo..." : "Solicitar financiamiento"}
              </motion.button>
              <a
                href={linkWhatsApp(mensajeWsp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={registrarLeadWsp}
                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-line px-6 text-sm font-semibold text-muted transition-colors duration-200 hover:border-white/25 hover:text-white"
              >
                Cotizar por WhatsApp
              </a>
            </>
          ) : (
            <a
              href={linkWhatsApp(mensajeWsp)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={registrarLeadWsp}
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
            >
              Cotizar financiamiento
            </a>
          )}
        </div>
      </div>

      <ModalSolicitud src={solicitudSrc} onClose={() => setSolicitudSrc(null)} />
    </>
  );
}
