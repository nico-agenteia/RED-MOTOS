"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCLP } from "@/lib/utils";
import { CATALOGO, precioVigente } from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/config";
import type { Moto } from "@/lib/tipos";

// Asistente conversacional con Claude (/api/recomendar). Responde preguntas
// frecuentes, recomienda motos reales del stock y captura el lead.

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const SALUDO: Mensaje = {
  role: "assistant",
  content:
    "¡Hola! 👋 Soy el asistente de Red Motos. Cuéntame qué andas buscando y te ayudo a encontrar tu moto ideal. Para partir: ¿más o menos cuánto piensas invertir?",
};

function avisarEstado(abierto: boolean) {
  window.dispatchEvent(
    new CustomEvent("rm:recomendador-estado", { detail: { abierto } }),
  );
}

/** Busca en el catálogo la moto que el agente recomendó (texto libre). */
function motoDesdeTexto(texto: string | null): Moto | null {
  if (!texto) return null;
  const t = texto.toLowerCase();
  return (
    CATALOGO.find((m) => t.includes(m.id.toLowerCase())) ??
    CATALOGO.find((m) => t.includes(m.modelo.toLowerCase())) ??
    null
  );
}

export default function RecomendadorIA() {
  const [abierto, setAbierto] = useState(false);
  const [botonVisible, setBotonVisible] = useState(false);

  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [modeloRecomendado, setModeloRecomendado] = useState<string | null>(null);

  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // El asistente flotante aparece cuando el hero sale del viewport.
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setBotonVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setBotonVisible(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Abrir desde el CTA del hero o el pop-up ("rm:abrir-recomendador").
  useEffect(() => {
    const abrir = () => {
      setAbierto(true);
      avisarEstado(true);
    };
    window.addEventListener("rm:abrir-recomendador", abrir);
    return () => window.removeEventListener("rm:abrir-recomendador", abrir);
  }, []);

  // Autoscroll al último mensaje.
  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, enviando, abierto]);

  // Focus al abrir.
  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 200);
  }, [abierto]);

  function abrirAsistente() {
    setAbierto(true);
    avisarEstado(true);
  }

  function cerrarAsistente() {
    setAbierto(false);
    avisarEstado(false);
  }

  async function enviar() {
    const texto = input.trim();
    if (!texto || enviando) return;

    const nuevos: Mensaje[] = [...mensajes, { role: "user", content: texto }];
    setMensajes(nuevos);
    setInput("");
    setEnviando(true);

    try {
      const res = await fetch("/api/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // El saludo inicial es de UI; no se manda al modelo.
          messages: nuevos,
          leadId,
        }),
      });
      const data = await res.json();

      if (data.leadId) setLeadId(data.leadId);
      if (data.modeloRecomendado) setModeloRecomendado(data.modeloRecomendado);
      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            "Perdona, tuve un problema. Escríbenos por WhatsApp y te ayudamos 🙌",
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Se me cayó la conexión 😅. ¿Lo intentamos de nuevo o prefieres escribirnos por WhatsApp?",
        },
      ]);
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  const motoCard = motoDesdeTexto(modeloRecomendado);

  return (
    <>
      {/* ── Sección ancla en la página ─────────────────────────────── */}
      <section
        id="recomendador"
        aria-label="Asistente de motos con IA"
        className="bg-surface py-24"
      >
        <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
          <p className="label-mono mb-3">Asistente IA</p>
          <h2
            className="headline-display text-white"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Encuentra tu moto
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Conversa con nuestro asistente: te ayuda a elegir, responde tus dudas
            y te conecta con un vendedor — como hablar con alguien de la tienda.
          </p>
          <motion.button
            type="button"
            onClick={abrirAsistente}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mt-8 inline-flex min-h-[48px] items-center rounded-md bg-red-500 px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-red-600"
          >
            Hablar con el asistente
          </motion.button>
        </div>
      </section>

      {/* ── Botón flotante (aparece al salir del hero) ─────────────── */}
      <AnimatePresence>
        {botonVisible && !abierto && (
          <motion.button
            type="button"
            key="fab-recomendador"
            onClick={abrirAsistente}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            aria-label="Abrir asistente: encuentra tu moto"
            className="fixed bottom-6 right-24 z-40 flex min-h-[52px] items-center gap-3 rounded-full border border-line bg-surface-2 py-2 pl-2 pr-5 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 font-display text-base font-extrabold text-white">
              R
            </span>
            <span className="text-sm font-semibold text-white">
              Encuentra tu moto
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Asistente: card desktop / bottom-sheet mobile ──────────── */}
      <AnimatePresence>
        {abierto && (
          <>
            <motion.div
              key="scrim-recomendador"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={cerrarAsistente}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-black/60 md:bg-transparent"
            />
            <motion.div
              key="panel-recomendador"
              role="dialog"
              aria-modal="true"
              aria-label="Asistente encuentra tu moto"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-xl border border-line bg-surface shadow-[0_-12px_48px_rgba(0,0,0,0.6)] md:inset-x-auto md:bottom-6 md:right-6 md:h-[600px] md:max-h-[85dvh] md:w-[400px] md:rounded-xl md:shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 font-display text-base font-extrabold text-white">
                    R
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Asistente · Red Motos</p>
                    <p className="label-mono !text-[10px] !text-green-400">En línea</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cerrarAsistente}
                  aria-label="Cerrar asistente"
                  className="flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:text-white"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {mensajes.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                        m.role === "user"
                          ? "rounded-br-sm bg-red-500 text-white"
                          : "rounded-bl-sm bg-surface-2 text-white"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {/* Card de moto recomendada */}
                {motoCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-lg border border-line bg-surface-2"
                  >
                    <div className="flex aspect-[16/10] items-center justify-center bg-black">
                      <img
                        src={motoCard.img}
                        alt={`${motoCard.marca} ${motoCard.modelo}`}
                        loading="lazy"
                        className="h-full w-full object-contain p-3"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="label-mono !text-[10px]">{motoCard.marca}</p>
                        <p className="font-display text-base font-bold uppercase text-white">
                          {motoCard.modelo}
                        </p>
                        <p className="font-display text-lg font-extrabold text-red-500">
                          {formatCLP(precioVigente(motoCard))}
                        </p>
                      </div>
                      <a
                        href={linkWhatsApp(
                          `Hola! Me interesa la ${motoCard.marca} ${motoCard.modelo}. ¿Me pueden cotizar?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] shrink-0 items-center rounded-md bg-wsp px-4 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                      >
                        Cotizar
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Indicador "escribiendo…" */}
                {enviando && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-2 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
                    </div>
                  </div>
                )}
                <div ref={finRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar();
                }}
                className="flex items-center gap-2 border-t border-line p-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Escribe tu mensaje…"
                  className="min-h-[44px] flex-1 rounded-full border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || enviando}
                  aria-label="Enviar mensaje"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
