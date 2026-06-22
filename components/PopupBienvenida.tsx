"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { scrollSuave } from "@/lib/gsap-setup";

// Pop-up de bienvenida: aparece a los 5s, captura nombre + WhatsApp + motivo y
// ruta al cliente a agendar un servicio o a cotizar con el asistente.

const STORAGE_KEY = "rm:popup-visto";
const DIAS_REAPARICION = 7;
const DELAY_MS = 5000;

type Motivo = "cotizar" | "servicio";

function yaVisto(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return false;
    const ts = parseInt(v, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DIAS_REAPARICION * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function PopupBienvenida() {
  const [abierto, setAbierto] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [motivo, setMotivo] = useState<Motivo>("cotizar");

  const reducir = useReducedMotion();
  const recomendadorAbierto = useRef(false);

  // No abrir si el asistente está abierto (evita solaparse).
  useEffect(() => {
    const onEstado = (e: Event) => {
      recomendadorAbierto.current = Boolean(
        (e as CustomEvent<{ abierto: boolean }>).detail?.abierto,
      );
    };
    window.addEventListener("rm:recomendador-estado", onEstado);
    return () => window.removeEventListener("rm:recomendador-estado", onEstado);
  }, []);

  // Temporizador de 5s (una vez por semana).
  useEffect(() => {
    if (yaVisto()) return;
    const t = setTimeout(() => {
      if (recomendadorAbierto.current) return;
      setAbierto(true);
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* sin localStorage, igual mostramos */
      }
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // ESC + bloqueo de scroll del body mientras está abierto.
  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onTecla);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  function cerrar() {
    setAbierto(false);
  }

  function rutearPorMotivo() {
    cerrar();
    setTimeout(() => {
      if (motivo === "servicio") {
        scrollSuave("#servicios", 72);
      } else {
        window.dispatchEvent(new CustomEvent("rm:abrir-recomendador"));
      }
    }, 250);
  }

  async function enviar() {
    if (enviando || nombre.trim().length < 2 || whatsapp.trim().length < 8) return;
    setEnviando(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen: "popup",
          nombre: nombre.trim(),
          whatsapp: whatsapp.trim(),
          score: motivo === "servicio" ? "warm" : "cold",
          payload: { motivo },
        }),
      }).catch(() => {});
      setEnviado(true);
      setTimeout(rutearPorMotivo, 1100);
    } finally {
      setEnviando(false);
    }
  }

  const animPanel = reducir
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 40, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 40, scale: 0.98 },
      };

  const puedeEnviar = nombre.trim().length >= 2 && whatsapp.trim().length >= 8;

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={cerrar}
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            {...animPanel}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenido a Red Motos"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
          >
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {enviado ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/15 text-green-400">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold uppercase text-white">
                  ¡Gracias, {nombre.split(" ")[0]}!
                </h3>
                <p className="mt-2 text-muted">
                  {motivo === "servicio"
                    ? "Te llevamos a agendar tu servicio…"
                    : "Abrimos el asistente para ayudarte a elegir…"}
                </p>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                <p className="label-mono mb-2">Bienvenido a Red Motos</p>
                <h3
                  className="headline-display text-white"
                  style={{ fontSize: "clamp(26px, 5vw, 34px)" }}
                >
                  ¿Te ayudamos a partir?
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Déjanos tus datos y te contactamos al tiro. Sin compromiso.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    autoComplete="name"
                    placeholder="Tu nombre"
                    className="min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    autoComplete="tel"
                    placeholder="Tu WhatsApp (+56 9 …)"
                    className="min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
                  />

                  <p className="mt-1 text-sm font-medium text-white">¿Qué necesitas?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "cotizar", label: "Cotizar una moto" },
                        { id: "servicio", label: "Agendar un servicio" },
                      ] as { id: Motivo; label: string }[]
                    ).map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setMotivo(op.id)}
                        aria-pressed={motivo === op.id}
                        className={`min-h-[48px] rounded-md border px-3 text-sm font-medium transition-colors ${
                          motivo === op.id
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-line bg-surface-2 text-muted hover:text-white"
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={enviar}
                    disabled={!puedeEnviar || enviando}
                    className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 text-base font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {enviando ? "Enviando…" : "Quiero que me contacten"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
