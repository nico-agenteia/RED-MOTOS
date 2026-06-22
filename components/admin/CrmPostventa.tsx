"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VentaPostventa } from "@/lib/tipos";

type EstadoHito = "hecho" | "vencida" | "proxima" | "futura";

const HITOS = [
  { key: "1m", meses: 1, label: "1 mes", campo: "hito1m" },
  { key: "4m", meses: 4, label: "4 meses", campo: "hito4m" },
  { key: "8m", meses: 8, label: "8 meses", campo: "hito8m" },
  { key: "12m", meses: 12, label: "Renovación", campo: "hito12m" },
] as const;

function sumarMeses(fecha: string, n: number): Date {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

function estadoHito(target: Date, hecho: boolean): EstadoHito {
  if (hecho) return "hecho";
  const diffDias = (target.getTime() - Date.now()) / 86_400_000;
  if (diffDias < 0) return "vencida";
  if (diffDias <= 7) return "proxima";
  return "futura";
}

function claseHito(estado: EstadoHito): string {
  switch (estado) {
    case "hecho":
      return "bg-green-600/20 text-green-400 border-green-600/40";
    case "vencida":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    case "proxima":
      return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    default:
      return "bg-surface-2 text-muted border-line";
  }
}

function emojiHito(estado: EstadoHito): string {
  return estado === "hecho" ? "✓" : estado === "vencida" ? "🔴" : estado === "proxima" ? "🟡" : "🟢";
}

function fechaLabel(d: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function linkWsp(whatsapp: string, mensaje: string): string {
  const num = whatsapp.replace(/\D/g, "");
  const numero = num.startsWith("56") ? num : `56${num}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

const inputCls =
  "min-h-[44px] w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none";

const FORM_VACIO = {
  nombre: "",
  whatsapp: "",
  email: "",
  marca: "",
  modelo: "",
  patente: "",
  fechaCompra: "",
  vendedor: "",
  notas: "",
};

export default function CrmPostventa() {
  const [ventas, setVentas] = useState<VentaPostventa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/ventas");
      const datos = await res.json();
      setVentas(datos.ventas ?? []);
    } catch {
      setVentas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function registrar() {
    if (guardando) return;
    if (form.nombre.trim().length < 2 || form.whatsapp.trim().length < 8 || !form.fechaCompra) {
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          whatsapp: form.whatsapp.trim(),
          email: form.email.trim() || undefined,
          marca: form.marca.trim() || undefined,
          modelo: form.modelo.trim() || undefined,
          patente: form.patente.trim() || undefined,
          fechaCompra: form.fechaCompra,
          vendedor: form.vendedor.trim() || undefined,
          notas: form.notas.trim() || undefined,
        }),
      });
      if (res.ok) {
        setForm({ ...FORM_VACIO });
        setFormAbierto(false);
        void cargar();
      }
    } finally {
      setGuardando(false);
    }
  }

  async function toggleHito(venta: VentaPostventa, hitoKey: string, valorActual: boolean) {
    await fetch(`/api/ventas?id=${encodeURIComponent(venta.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hito: hitoKey, hecho: !valorActual }),
    });
    void cargar();
  }

  // Métricas derivadas.
  const metricas = useMemo(() => {
    let vencidas = 0;
    let proximas = 0;
    let renovaciones = 0;
    for (const v of ventas) {
      for (const h of HITOS) {
        const hecho = v[h.campo] as boolean;
        if (hecho) continue;
        const est = estadoHito(sumarMeses(v.fechaCompra, h.meses), false);
        if (h.key === "12m") {
          if (est === "vencida" || est === "proxima") renovaciones++;
        } else if (est === "vencida") {
          vencidas++;
        }
        if (est === "proxima") proximas++;
      }
    }
    return { total: ventas.length, vencidas, proximas, renovaciones };
  }, [ventas]);

  function mensajeHito(v: VentaPostventa, h: (typeof HITOS)[number]): string {
    const moto = [v.marca, v.modelo].filter(Boolean).join(" ");
    if (h.key === "12m") {
      return `Hola ${v.nombre.split(" ")[0]}! Te escribimos de Red Motos 🏍️. Tu ${moto || "moto"} ya cumple un año — tienes la opción de renovarla dejándola en parte de pago. ¿Te muestro las opciones?`;
    }
    return `Hola ${v.nombre.split(" ")[0]}! Te escribimos de Red Motos 🏍️. Tu ${moto || "moto"} ya cumple ${h.label} desde la compra — te recordamos agendar tu mantención. ¿Coordinamos?`;
  }

  /** Próximo hito pendiente (el más cercano sin hacer), para el botón WhatsApp. */
  function proximoHito(v: VentaPostventa) {
    const pendientes = HITOS.filter((h) => !(v[h.campo] as boolean)).map((h) => ({
      h,
      target: sumarMeses(v.fechaCompra, h.meses),
    }));
    if (pendientes.length === 0) return null;
    pendientes.sort((a, b) => a.target.getTime() - b.target.getTime());
    return pendientes[0].h;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase text-white md:text-3xl">
            CRM Postventa
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            Seguimiento de mantenciones (1 · 4 · 8 meses) y renovación a los 12.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAbierto((v) => !v)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
        >
          {formAbierto ? "Cerrar" : "+ Registrar venta 0 km"}
        </button>
      </div>

      {/* Formulario de registro */}
      {formAbierto && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 overflow-hidden rounded-xl border border-line bg-surface-2 p-4 md:p-6"
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <input className={inputCls} placeholder="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input className={inputCls} placeholder="WhatsApp *" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <label className="flex flex-col gap-1">
              <span className="label-mono !text-[10px]">Fecha de compra *</span>
              <input type="date" className={inputCls} value={form.fechaCompra} onChange={(e) => setForm({ ...form, fechaCompra: e.target.value })} />
            </label>
            <input className={inputCls} placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
            <input className={inputCls} placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            <input className={inputCls} placeholder="Patente" value={form.patente} onChange={(e) => setForm({ ...form, patente: e.target.value })} />
            <input className={inputCls} placeholder="Vendedor" value={form.vendedor} onChange={(e) => setForm({ ...form, vendedor: e.target.value })} />
            <input className={inputCls} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={inputCls} placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
          <button
            type="button"
            onClick={registrar}
            disabled={guardando || form.nombre.trim().length < 2 || form.whatsapp.trim().length < 8 || !form.fechaCompra}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar venta"}
          </button>
        </motion.div>
      )}

      {/* Métricas */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { etiqueta: "Ventas", valor: metricas.total },
          { etiqueta: "Mant. vencidas", valor: metricas.vencidas },
          { etiqueta: "Próximas (≤7d)", valor: metricas.proximas },
          { etiqueta: "Renovaciones", valor: metricas.renovaciones },
        ].map((m) => (
          <div key={m.etiqueta} className="rounded-xl border border-line bg-surface-2 p-3 md:p-4">
            <p className="label-mono !text-[10px] md:!text-[11px]">{m.etiqueta}</p>
            <p className="font-display mt-1 text-2xl font-bold text-white md:text-3xl">{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Lista de ventas */}
      <div className="mt-6 flex flex-col gap-3">
        {cargando ? (
          <p className="py-12 text-center text-muted">Cargando…</p>
        ) : ventas.length === 0 ? (
          <p className="py-12 text-center text-muted">
            Aún no hay ventas registradas. Usa “Registrar venta 0 km”.
          </p>
        ) : (
          ventas.map((v) => {
            const prox = proximoHito(v);
            return (
              <div key={v.id} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  {/* Cliente + moto */}
                  <div className="min-w-0">
                    <p className="font-medium text-white">{v.nombre}</p>
                    <p className="text-xs text-muted">
                      {[v.marca, v.modelo, v.patente].filter(Boolean).join(" · ") || "Sin moto"}
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {v.whatsapp}
                      {v.vendedor ? ` · vendió: ${v.vendedor}` : ""}
                    </p>
                    <p className="label-mono mt-1 !text-[10px]">
                      Compra: {fechaLabel(new Date(`${v.fechaCompra}T12:00:00Z`))}
                    </p>
                  </div>

                  {/* WhatsApp del próximo hito */}
                  {prox && (
                    <motion.a
                      href={linkWsp(v.whatsapp, mensajeHito(v, prox))}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-md bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      <span aria-hidden="true">💬</span> Recordar {prox.label}
                    </motion.a>
                  )}
                </div>

                {/* Hitos */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {HITOS.map((h) => {
                    const hecho = v[h.campo] as boolean;
                    const target = sumarMeses(v.fechaCompra, h.meses);
                    const est = estadoHito(target, hecho);
                    return (
                      <button
                        key={h.key}
                        type="button"
                        onClick={() => void toggleHito(v, h.key, hecho)}
                        title={`${fechaLabel(target)} — clic para marcar ${hecho ? "pendiente" : "hecho"}`}
                        className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${claseHito(est)}`}
                      >
                        <span className="text-[11px] font-semibold">
                          {emojiHito(est)} {h.label}
                        </span>
                        <span className="text-[10px] opacity-70">{fechaLabel(target)}</span>
                      </button>
                    );
                  })}
                </div>
                {v.notas && <p className="mt-2 text-xs italic text-muted">{v.notas}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
