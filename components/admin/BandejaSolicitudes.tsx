"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatCLP } from "@/lib/utils";
import type { SolicitudAutofin } from "@/lib/tipos";

// Color del badge según el resultado del evaluador automático de Autofin.
function claseEstado(estado: string | null): string {
  const e = (estado ?? "").toLowerCase();
  if (e.includes("aprob")) return "bg-green-600 text-white";
  if (e.includes("rechaz")) return "bg-red-500 text-white";
  if (e.includes("dudoso") || e.includes("evalua"))
    return "bg-amber-500 text-black";
  return "bg-surface-2 text-muted border border-line";
}

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function linkWsp(telefono: string | null): string | null {
  if (!telefono) return null;
  const num = telefono.replace(/\D/g, "");
  if (!num) return null;
  const numero = num.startsWith("56") ? num : `56${num}`;
  return `https://wa.me/${numero}`;
}

const FILTROS = ["todos", "Aprobado", "Dudoso", "Rechazado"] as const;

export default function BandejaSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAutofin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtro !== "todos") params.set("estado", filtro);
      const res = await fetch(`/api/solicitudes?${params.toString()}`);
      const datos = await res.json();
      setSolicitudes(datos.solicitudes ?? []);
    } catch {
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function marcarAtendida(id: string) {
    await fetch(`/api/solicitudes?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
    });
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, atendido: true } : s)),
    );
  }

  const total = solicitudes.length;
  const aprobadas = solicitudes.filter((s) =>
    (s.estadoEvaluacion ?? "").toLowerCase().includes("aprob"),
  ).length;
  const enRevision = solicitudes.filter((s) => {
    const e = (s.estadoEvaluacion ?? "").toLowerCase();
    return e.includes("dudoso") || e.includes("evalua");
  }).length;
  const sinAtender = solicitudes.filter((s) => !s.atendido).length;

  return (
    <div>
      <h2 className="font-display text-3xl font-bold uppercase text-white">
        Solicitudes de Financiamiento
      </h2>
      <p className="mt-1 max-w-lg text-sm text-muted">
        Solicitudes enviadas a Autofin desde el simulador, con el resultado de la
        evaluación automática de riesgo.
      </p>

      {/* Métricas rápidas */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { etiqueta: "Total", valor: total },
          { etiqueta: "Aprobadas", valor: aprobadas },
          { etiqueta: "En revisión", valor: enRevision },
          { etiqueta: "Sin atender", valor: sinAtender },
        ].map((m) => (
          <div
            key={m.etiqueta}
            className="rounded-xl border border-line bg-surface-2 p-4"
          >
            <p className="label-mono !text-[11px]">{m.etiqueta}</p>
            <p className="font-display mt-1 text-3xl font-bold text-white">
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`min-h-[36px] rounded-full border px-4 text-xs font-medium transition-colors duration-200 ${
              filtro === f
                ? "border-red-500 bg-red-500 text-white"
                : "border-line text-muted hover:text-white"
            }`}
          >
            {f === "todos" ? "Todas" : f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {[
                "Estado",
                "Cliente",
                "Contacto",
                "Moto",
                "Cuota / Plazo / CAE",
                "N° Trinidad",
                "Fecha",
                "",
              ].map((h) => (
                <th key={h} className="label-mono px-4 py-3 !text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted">
                  Cargando…
                </td>
              </tr>
            ) : solicitudes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted">
                  Aún no hay solicitudes. Aparecerán aquí cuando Autofin notifique
                  el resultado de una evaluación.
                </td>
              </tr>
            ) : (
              solicitudes.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-line align-top transition-colors last:border-0 hover:bg-surface ${
                    s.atendido ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-sm px-2 py-1 text-[11px] font-semibold ${claseEstado(
                        s.estadoEvaluacion,
                      )}`}
                    >
                      {s.estadoEvaluacion ?? "—"}
                    </span>
                    {s.estadoTrinidad && (
                      <p className="label-mono mt-1 !text-[9px]">
                        {s.estadoTrinidad}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{s.nombre ?? "—"}</p>
                    {s.rut && (
                      <p className="font-mono text-xs text-muted">{s.rut}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.telefono && (
                      <p className="font-mono text-xs text-white">
                        {s.telefono}
                      </p>
                    )}
                    {s.email && <p className="text-xs">{s.email}</p>}
                    {!s.telefono && !s.email && "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {[s.marca, s.modelo].filter(Boolean).join(" ") || "—"}
                    {s.anio ? ` · ${s.anio}` : ""}
                    {s.precio ? (
                      <p className="font-mono text-xs">{formatCLP(s.precio)}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white">
                    {s.valorCuota ? formatCLP(s.valorCuota) : "—"}
                    <span className="text-muted">
                      {s.plazo ? ` · ${s.plazo} cuotas` : ""}
                      {s.cae ? ` · CAE ${s.cae}%` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {s.idTrinidad ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {fechaCorta(s.creadoEn)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {linkWsp(s.telefono) && (
                        <motion.a
                          href={linkWsp(s.telefono)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileTap={{ scale: 0.96 }}
                          className="inline-flex min-h-[32px] items-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          WA
                        </motion.a>
                      )}
                      {!s.atendido && (
                        <button
                          type="button"
                          onClick={() => void marcarAtendida(s.id)}
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
    </div>
  );
}
