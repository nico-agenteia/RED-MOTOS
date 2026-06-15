"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Lead, LeadScore } from "@/lib/tipos";

const BADGE: Record<LeadScore, string> = {
  hot: "bg-red-500 text-white",
  warm: "bg-amber-500 text-black",
  cold: "bg-surface-2 text-muted border border-line",
};

const EMOJI: Record<LeadScore, string> = { hot: "🔥", warm: "☀️", cold: "❄️" };

const WHATSAPP_BASE = "https://wa.me/";

function mensajeWsp(lead: Lead): string {
  const partes = [
    `Hola${lead.nombre ? ` ${lead.nombre}` : ""}!`,
    `Te escribo desde Red Motos Chile.`,
    lead.uso ? `Vi que buscas una moto para ${lead.uso.toLowerCase()}.` : "",
    lead.presupuesto ? `Tu presupuesto es ${lead.presupuesto}.` : "",
    `¿Podemos ayudarte a encontrar la moto ideal?`,
  ];
  return encodeURIComponent(partes.filter(Boolean).join(" "));
}

function linkWsp(lead: Lead): string | null {
  if (!lead.whatsapp) return null;
  const num = lead.whatsapp.replace(/\D/g, "");
  const numero = num.startsWith("56") ? num : `56${num}`;
  return `${WHATSAPP_BASE}${numero}?text=${mensajeWsp(lead)}`;
}

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function BandejaLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroScore, setFiltroScore] = useState<LeadScore | "todos">("todos");
  const [soloSinAtender, setSoloSinAtender] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroScore !== "todos") params.set("score", filtroScore);
      if (soloSinAtender) params.set("atendido", "false");
      const res = await fetch(`/api/leads?${params.toString()}`);
      const datos = await res.json();
      setLeads(datos.leads ?? []);
    } catch {
      setLeads([]);
    } finally {
      setCargando(false);
    }
  }, [filtroScore, soloSinAtender]);

  useEffect(() => { void cargar(); }, [cargar]);

  async function marcarAtendido(id: string) {
    await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "PATCH" });
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, atendido: true } : l)),
    );
  }

  const hot = leads.filter((l) => l.score === "hot").length;
  const warm = leads.filter((l) => l.score === "warm").length;
  const sinAtender = leads.filter((l) => !l.atendido).length;

  return (
    <div>
      <h2 className="font-display text-3xl font-bold uppercase text-white">
        Bandeja de Leads
      </h2>
      <p className="mt-1 max-w-lg text-sm text-muted">
        Consultas capturadas desde el Recomendador IA y el Simulador de Cuotas.
      </p>

      {/* Métricas rápidas */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { etiqueta: "Total leads", valor: leads.length },
          { etiqueta: "Sin atender", valor: sinAtender },
          { etiqueta: "🔥 Hot", valor: hot },
          { etiqueta: "☀️ Warm", valor: warm },
        ].map((m) => (
          <div key={m.etiqueta} className="rounded-xl border border-line bg-surface-2 p-4">
            <p className="label-mono !text-[11px]">{m.etiqueta}</p>
            <p className="font-display mt-1 text-3xl font-bold text-white">{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {(["todos", "hot", "warm", "cold"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFiltroScore(s)}
            className={`min-h-[36px] rounded-full border px-4 text-xs font-medium transition-colors duration-200 ${
              filtroScore === s
                ? "border-red-500 bg-red-500 text-white"
                : "border-line text-muted hover:text-white"
            }`}
          >
            {s === "todos" ? "Todos" : `${EMOJI[s]} ${s}`}
          </button>
        ))}
        <label className="flex min-h-[36px] cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={soloSinAtender}
            onChange={(e) => setSoloSinAtender(e.target.checked)}
            className="h-4 w-4 accent-red-500"
          />
          Solo sin atender
        </label>
      </div>

      {/* Tabla */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {["Score", "Nombre", "WhatsApp", "Origen", "Uso / Presupuesto", "Urgencia", "Fecha", ""].map((h) => (
                <th key={h} className="label-mono px-4 py-3 !text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">Cargando…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No hay leads con ese filtro.</td></tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-line transition-colors last:border-0 hover:bg-surface ${lead.atendido ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    {lead.score ? (
                      <span className={`rounded-sm px-2 py-1 text-[11px] font-semibold ${BADGE[lead.score]}`}>
                        {EMOJI[lead.score]} {lead.score}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{lead.nombre ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{lead.whatsapp ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-muted">{lead.origen}</td>
                  <td className="px-4 py-3 text-muted">
                    {[lead.uso, lead.presupuesto].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{lead.urgencia ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{fechaCorta(lead.creadoEn)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {linkWsp(lead) && (
                        <motion.a
                          href={linkWsp(lead)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileTap={{ scale: 0.96 }}
                          className="inline-flex min-h-[32px] items-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          WA
                        </motion.a>
                      )}
                      {!lead.atendido && (
                        <button
                          type="button"
                          onClick={() => void marcarAtendido(lead.id)}
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
