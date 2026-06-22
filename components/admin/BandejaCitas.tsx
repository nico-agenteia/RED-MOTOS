"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatCLP } from "@/lib/utils";
import type { Cita } from "@/lib/tipos";

function claseEstado(estado: string): string {
  switch (estado) {
    case "confirmada":
      return "bg-green-600 text-white";
    case "completada":
      return "bg-sky-600 text-white";
    case "cancelada":
      return "bg-red-500 text-white";
    default:
      return "bg-amber-500 text-black"; // pendiente
  }
}

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function agendaLabel(c: Cita): string {
  if (!c.fecha) return "Sin agenda (cotización)";
  const d = new Date(`${c.fecha}T12:00:00Z`);
  const fecha = new Intl.DateTimeFormat("es-CL", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  return `${fecha}${c.hora ? ` · ${c.hora}` : ""}`;
}

function linkWsp(whatsapp: string): string {
  const num = whatsapp.replace(/\D/g, "");
  const numero = num.startsWith("56") ? num : `56${num}`;
  return `https://wa.me/${numero}`;
}

const FILTROS = ["todos", "pendiente", "confirmada", "completada", "cancelada"] as const;
const ESTADOS: Cita["estado"][] = ["pendiente", "confirmada", "completada", "cancelada"];

export default function BandejaCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtro !== "todos") params.set("estado", filtro);
      const res = await fetch(`/api/citas?${params.toString()}`);
      const datos = await res.json();
      setCitas(datos.citas ?? []);
    } catch {
      setCitas([]);
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function cambiarEstado(id: string, estado: string) {
    await fetch(`/api/citas?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
  }

  async function marcarAtendida(id: string) {
    await fetch(`/api/citas?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atendido: true }),
    });
    setCitas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, atendido: true } : c)),
    );
  }

  const total = citas.length;
  const pendientes = citas.filter((c) => c.estado === "pendiente").length;
  const conAgenda = citas.filter((c) => c.fecha && c.estado !== "cancelada").length;
  const sinAtender = citas.filter((c) => !c.atendido).length;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold uppercase text-white md:text-3xl">
        Citas de servicio
      </h2>
      <p className="mt-1 max-w-lg text-sm text-muted">
        Reparaciones y mantenciones agendadas desde el sitio.
      </p>

      {/* Métricas */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4 md:gap-4">
        {[
          { etiqueta: "Total", valor: total },
          { etiqueta: "Pendientes", valor: pendientes },
          { etiqueta: "Con agenda", valor: conAgenda },
          { etiqueta: "Sin atender", valor: sinAtender },
        ].map((m) => (
          <div
            key={m.etiqueta}
            className="rounded-xl border border-line bg-surface-2 p-3 md:p-4"
          >
            <p className="label-mono !text-[10px] md:!text-[11px]">{m.etiqueta}</p>
            <p className="font-display mt-1 text-2xl font-bold text-white md:text-3xl">
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-6 md:gap-3">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`min-h-[36px] rounded-full border px-3 text-xs font-medium capitalize transition-colors duration-200 md:px-4 ${
              filtro === f
                ? "border-red-500 bg-red-500 text-white"
                : "border-line text-muted hover:text-white"
            }`}
          >
            {f === "todos" ? "Todas" : f}
          </button>
        ))}
      </div>

      {/* ── Tabla desktop ──────────────────────────────────────────── */}
      <div className="mt-6 hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {["Estado", "Tipo", "Cliente", "Moto", "Agenda / Detalle", "Recibido", ""].map(
                (h) => (
                  <th key={h} className="label-mono px-4 py-3 !text-[10px]">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Cargando…
                </td>
              </tr>
            ) : citas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Aún no hay citas.
                </td>
              </tr>
            ) : (
              citas.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-line align-top transition-colors last:border-0 hover:bg-surface ${
                    c.atendido ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <select
                      value={c.estado}
                      onChange={(e) => void cambiarEstado(c.id, e.target.value)}
                      className={`rounded-sm px-2 py-1 text-[11px] font-semibold capitalize ${claseEstado(c.estado)}`}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e} className="bg-surface text-white">
                          {e}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-white">{c.tipo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{c.nombre}</p>
                    <p className="font-mono text-xs text-muted">{c.whatsapp}</p>
                    {c.email && <p className="text-xs text-muted">{c.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {[c.marca, c.modelo].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <p className="text-white/80">{agendaLabel(c)}</p>
                    {c.precioEstimado ? (
                      <p className="font-mono text-xs">Est. {formatCLP(c.precioEstimado)}</p>
                    ) : null}
                    {c.descripcion && (
                      <p className="mt-1 max-w-xs text-xs italic">{c.descripcion}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {fechaCorta(c.creadoEn)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <motion.a
                        href={linkWsp(c.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex min-h-[32px] items-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        WA
                      </motion.a>
                      {!c.atendido && (
                        <button
                          type="button"
                          onClick={() => void marcarAtendida(c.id)}
                          className="inline-flex min-h-[32px] items-center rounded-md border border-line px-3 text-xs text-muted transition-colors hover:text-white"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Cards mobile ───────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-3 md:hidden">
        {cargando ? (
          <p className="py-12 text-center text-muted">Cargando…</p>
        ) : citas.length === 0 ? (
          <p className="py-12 text-center text-muted">Aún no hay citas.</p>
        ) : (
          citas.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl border border-line bg-surface-2 p-4 ${
                c.atendido ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-sm px-2 py-1 text-[11px] font-semibold capitalize ${claseEstado(c.estado)}`}
                >
                  {c.tipo} · {c.estado}
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {fechaCorta(c.creadoEn)}
                </span>
              </div>

              <p className="mt-2 font-medium text-white">{c.nombre}</p>
              <div className="mt-1 space-y-1 text-xs text-muted">
                <p className="font-mono text-white/70">{c.whatsapp}</p>
                {(c.marca || c.modelo) && (
                  <p className="text-white/80">
                    {[c.marca, c.modelo].filter(Boolean).join(" ")}
                  </p>
                )}
                <p>{agendaLabel(c)}</p>
                {c.precioEstimado ? (
                  <p className="font-mono">Est. {formatCLP(c.precioEstimado)}</p>
                ) : null}
                {c.descripcion && <p className="italic">{c.descripcion}</p>}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  value={c.estado}
                  onChange={(e) => void cambiarEstado(c.id, e.target.value)}
                  className="min-h-[40px] rounded-md border border-line bg-surface px-3 text-sm capitalize text-white"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <motion.a
                  href={linkWsp(c.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <span aria-hidden="true">💬</span> WhatsApp
                </motion.a>
                {!c.atendido && (
                  <button
                    type="button"
                    onClick={() => void marcarAtendida(c.id)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-white"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
