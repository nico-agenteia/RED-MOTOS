"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import {
  MARCAS_SERVICIO,
  precioMantencion,
  type TipoServicio,
} from "@/lib/servicios";

interface SlotDisp {
  hora: string;
  estado: "libre" | "ocupado";
}
interface DiaDisp {
  fecha: string;
  slots: SlotDisp[];
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function etiquetaDia(fecha: string) {
  const d = new Date(`${fecha}T12:00:00Z`);
  return { dow: DOW[d.getUTCDay()], dia: d.getUTCDate(), mes: MESES[d.getUTCMonth()] };
}

const inputCls =
  "min-h-[44px] w-full rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none";

export default function Servicios() {
  const [tab, setTab] = useState<TipoServicio>("Mantenimiento");

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [dias, setDias] = useState<DiaDisp[]>([]);
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [horaSel, setHoraSel] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const modelosDeMarca = useMemo(
    () => MARCAS_SERVICIO.find((m) => m.marca === marca)?.modelos ?? [],
    [marca],
  );
  const estimado = marca && modelo ? precioMantencion(marca, modelo) : 0;
  const diaActivo = dias.find((d) => d.fecha === diaSel) ?? null;

  async function cargarDisponibilidad() {
    try {
      const res = await fetch("/api/citas/disponibilidad");
      const data = await res.json();
      setDias(data.dias ?? []);
    } catch {
      setDias([]);
    }
  }

  useEffect(() => {
    void cargarDisponibilidad();
  }, []);

  function cambiarTab(t: TipoServicio) {
    setTab(t);
    setError(null);
    setOk(false);
  }

  function reiniciar() {
    setOk(false);
    setError(null);
    setMarca("");
    setModelo("");
    setDescripcion("");
    setNombre("");
    setWhatsapp("");
    setEmail("");
    setDiaSel(null);
    setHoraSel(null);
    void cargarDisponibilidad();
  }

  const puedeEnviar =
    nombre.trim().length > 1 &&
    whatsapp.trim().length >= 8 &&
    (tab === "Mantenimiento"
      ? Boolean(marca && modelo && diaSel && horaSel)
      : descripcion.trim().length > 3);

  async function enviar() {
    if (!puedeEnviar || enviando) return;
    setEnviando(true);
    setError(null);

    const body: Record<string, unknown> = {
      tipo: tab,
      nombre: nombre.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim() || undefined,
      marca: marca || undefined,
      modelo: modelo || undefined,
    };
    if (tab === "Mantenimiento") {
      body.fecha = diaSel;
      body.hora = horaSel;
      if (estimado > 0) body.precioEstimado = estimado;
    } else {
      body.descripcion = descripcion.trim();
    }

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        setError("Ese horario se acaba de ocupar. Elige otro, porfa.");
        setHoraSel(null);
        await cargarDisponibilidad();
        return;
      }
      if (!res.ok) {
        setError("No pudimos registrar tu solicitud. Intenta de nuevo.");
        return;
      }
      setOk(true);
    } catch {
      setError("Problema de conexión. Intenta de nuevo o escríbenos por WhatsApp.");
    } finally {
      setEnviando(false);
    }
  }

  const mensajeWspExito =
    tab === "Mantenimiento"
      ? `Hola! Agendé una mantención${marca ? ` para mi ${marca} ${modelo}` : ""}${
          diaSel && horaSel ? ` el ${etiquetaDia(diaSel).dia} ${etiquetaDia(diaSel).mes} a las ${horaSel}` : ""
        }. ¿Me confirman?`
      : `Hola! Necesito una reparación${marca ? ` para mi ${marca} ${modelo}` : ""}. ${descripcion}`;

  return (
    <section id="servicios" aria-label="Reparaciones y Mantenimiento" className="bg-black py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="text-center">
          <p className="label-mono mb-3">Postventa</p>
          <h2
            className="headline-display text-white"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Reparaciones y Mantenimiento
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Agenda el servicio de tu moto mirando la disponibilidad real del taller.
            Mantención preventiva o reparación — te dejamos lista la moto.
          </p>
        </div>

        {/* Tabs */}
        <div className="mx-auto mt-10 flex max-w-sm rounded-full border border-line bg-surface-2 p-1">
          {(["Mantenimiento", "Reparación"] as TipoServicio[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => cambiarTab(t)}
              aria-pressed={tab === t}
              className={`min-h-[44px] flex-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
                tab === t ? "bg-red-500 text-white" : "text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-line bg-surface p-6 md:p-8">
          <AnimatePresence mode="wait">
            {ok ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/15 text-green-400">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold uppercase text-white">
                  ¡Listo, {nombre.split(" ")[0]}!
                </h3>
                <p className="mt-2 text-muted">
                  {tab === "Mantenimiento"
                    ? "Tu solicitud de mantención quedó registrada. Te confirmamos por WhatsApp."
                    : "Recibimos tu solicitud. Un vendedor te contacta para cotizar la reparación."}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href={linkWhatsApp(mensajeWspExito)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-wsp px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Confirmar por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-line px-6 text-sm font-medium text-muted transition-colors hover:text-white"
                  >
                    Agendar otra
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Marca + modelo */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="label-mono !text-[11px]">Marca</span>
                    <select
                      value={marca}
                      onChange={(e) => {
                        setMarca(e.target.value);
                        setModelo("");
                      }}
                      className={inputCls}
                    >
                      <option value="">Elige tu marca…</option>
                      {MARCAS_SERVICIO.map((m) => (
                        <option key={m.marca} value={m.marca}>
                          {m.marca}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="label-mono !text-[11px]">Modelo</span>
                    <select
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      disabled={!marca}
                      className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <option value="">Elige tu modelo…</option>
                      {modelosDeMarca.map((mm) => (
                        <option key={mm.modelo} value={mm.modelo}>
                          {mm.modelo}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Estimado de mantención */}
                {tab === "Mantenimiento" && marca && modelo && (
                  <div className="rounded-lg border border-line bg-surface-2 p-4">
                    {estimado > 0 ? (
                      <>
                        <p className="label-mono !text-[10px]">Mantención estimada</p>
                        <p className="font-display text-2xl font-extrabold text-red-500">
                          {formatCLP(estimado)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Valor referencial. El monto final se confirma según el estado de la moto.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted">
                        Te confirmamos el valor de la mantención al momento de agendar. 👍
                      </p>
                    )}
                  </div>
                )}

                {/* ── Mantenimiento: agenda ───────────────────────────── */}
                {tab === "Mantenimiento" && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-white">Elige el día</p>
                    {dias.length === 0 ? (
                      <p className="text-sm text-muted">Cargando disponibilidad…</p>
                    ) : (
                      <div className="carrusel-snap flex gap-2 overflow-x-auto pb-2">
                        {dias.map((d) => {
                          const e = etiquetaDia(d.fecha);
                          const libres = d.slots.filter((s) => s.estado === "libre").length;
                          const activo = diaSel === d.fecha;
                          return (
                            <button
                              key={d.fecha}
                              type="button"
                              onClick={() => {
                                setDiaSel(d.fecha);
                                setHoraSel(null);
                              }}
                              disabled={libres === 0}
                              className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-lg border px-3 py-2 transition-colors ${
                                activo
                                  ? "border-red-500 bg-red-500 text-white"
                                  : libres === 0
                                    ? "border-line bg-surface-2 text-muted/40"
                                    : "border-line bg-surface-2 text-white hover:border-white/25"
                              }`}
                            >
                              <span className="text-[10px] uppercase opacity-70">{e.dow}</span>
                              <span className="font-display text-xl font-bold">{e.dia}</span>
                              <span className="text-[10px] opacity-70">{e.mes}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Slots del día */}
                    {diaActivo && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-white">Elige la hora</p>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                          {diaActivo.slots.map((s) => (
                            <button
                              key={s.hora}
                              type="button"
                              onClick={() => setHoraSel(s.hora)}
                              disabled={s.estado === "ocupado"}
                              className={`min-h-[40px] rounded-md border text-sm font-medium transition-colors ${
                                horaSel === s.hora
                                  ? "border-red-500 bg-red-500 text-white"
                                  : s.estado === "ocupado"
                                    ? "cursor-not-allowed border-line bg-surface-2 text-muted/30 line-through"
                                    : "border-line bg-surface-2 text-white hover:border-white/25"
                              }`}
                            >
                              {s.hora}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Reparación: descripción ─────────────────────────── */}
                {tab === "Reparación" && (
                  <label className="flex flex-col gap-1">
                    <span className="label-mono !text-[11px]">¿Qué le pasa a tu moto?</span>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Cuéntanos la falla o el síntoma para cotizarte la reparación…"
                      className={`${inputCls} min-h-[88px] resize-none py-3`}
                    />
                  </label>
                )}

                {/* Datos de contacto */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="label-mono !text-[11px]">Nombre</span>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      autoComplete="name"
                      placeholder="Tu nombre"
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="label-mono !text-[11px]">WhatsApp</span>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      autoComplete="tel"
                      placeholder="+56 9 ..."
                      className={inputCls}
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Email (opcional)</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="tucorreo@ejemplo.cl"
                    className={inputCls}
                  />
                </label>

                {error && (
                  <p className="rounded-md bg-red-500/10 px-4 py-2 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={enviar}
                  disabled={!puedeEnviar || enviando}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-red-500 text-base font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviando
                    ? "Enviando…"
                    : tab === "Mantenimiento"
                      ? "Agendar mantención"
                      : "Solicitar cotización"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
