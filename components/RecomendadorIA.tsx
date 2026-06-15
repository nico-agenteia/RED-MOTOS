"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RANGOS_PRESUPUESTO,
  recomendarMoto,
  scoreLead,
  EMOJI_SCORE,
  formatCLP,
} from "@/lib/utils";
import { precioVigente } from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/config";
import type { Uso, Experiencia, Moto } from "@/lib/tipos";

// TODO: conectar con /api/recomendar (Claude Haiku) — hoy la recomendación
// usa la lógica local de lib/utils.ts (presupuesto + uso + experiencia).

const USOS: Uso[] = ["Ciudad", "Ruta", "Off-road", "Trabajo", "Placer"];
const EXPERIENCIAS: Experiencia[] = [
  "Primera moto",
  "Algo de experiencia",
  "Experimentado",
];
const URGENCIAS = [
  "Esta semana",
  "Este mes",
  "En 3 meses",
  "Solo mirando",
] as const;

const slideStep = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
};

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${
        activo
          ? "border-red-500 bg-red-500 text-white"
          : "border-line bg-surface-2 text-muted hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function avisarEstado(abierto: boolean) {
  window.dispatchEvent(
    new CustomEvent("rm:recomendador-estado", { detail: { abierto } }),
  );
}

export default function RecomendadorIA() {
  const [abierto, setAbierto] = useState(false);
  const [botonVisible, setBotonVisible] = useState(false);
  const [paso, setPaso] = useState(1);

  const [presupuesto, setPresupuesto] = useState<string | null>(null);
  const [uso, setUso] = useState<Uso | null>(null);
  const [experiencia, setExperiencia] = useState<Experiencia | null>(null);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [urgencia, setUrgencia] = useState<(typeof URGENCIAS)[number] | null>(
    null,
  );
  const [recomendada, setRecomendada] = useState<Moto | null>(null);

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

  // Abrir desde el CTA del hero ("Encuentra tu moto").
  useEffect(() => {
    const abrir = () => {
      setAbierto(true);
      avisarEstado(true);
    };
    window.addEventListener("rm:abrir-recomendador", abrir);
    return () => window.removeEventListener("rm:abrir-recomendador", abrir);
  }, []);

  function abrirAsistente() {
    setAbierto(true);
    avisarEstado(true);
  }

  function cerrarAsistente() {
    setAbierto(false);
    avisarEstado(false);
  }

  function reiniciar() {
    setPaso(1);
    setPresupuesto(null);
    setUso(null);
    setExperiencia(null);
    setNombre("");
    setWhatsapp("");
    setUrgencia(null);
    setRecomendada(null);
  }

  function calcularResultado() {
    if (!presupuesto || !uso || !experiencia) return;
    const moto = recomendarMoto(presupuesto, uso, experiencia);
    setRecomendada(moto);
    setPaso(5);

    // Capturar lead en segundo plano (no bloquear la UX)
    void fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origen: "recomendador",
        nombre: nombre.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        presupuesto,
        uso,
        experiencia,
        urgencia: urgencia ?? undefined,
        score: urgencia ? scoreLead(urgencia) : "cold",
        payload: { modeloRecomendado: moto ? `${moto.marca} ${moto.modelo}` : null },
      }),
    }).catch(() => {/* silencioso — no interrumpir el flujo */});
  }

  const score = urgencia ? scoreLead(urgencia) : "cold";

  const mensajeWsp =
    recomendada && uso && presupuesto
      ? `Hola! Me llamo ${nombre || "—"}, busco una moto para ${uso.toLowerCase()}, presupuesto ${presupuesto}. Me recomendaron la ${recomendada.marca} ${recomendada.modelo}. ¿Pueden atenderme? ${EMOJI_SCORE[score]}`
      : "";

  const puedeAvanzar4 =
    nombre.trim().length > 1 && whatsapp.trim().length >= 8 && urgencia !== null;

  return (
    <>
      {/* ── Sección ancla en la página ─────────────────────────────── */}
      <section
        id="recomendador"
        aria-label="Recomendador de motos con IA"
        className="bg-surface py-24"
      >
        <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
          <p className="label-mono mb-3">IA Recomendador</p>
          <h2
            className="headline-display text-white"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Encuentra tu moto
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Responde 3 preguntas y te decimos exactamente qué moto del stock
            real te conviene — sin vueltas, sin parálisis de decisión.
          </p>
          <motion.button
            type="button"
            onClick={abrirAsistente}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mt-8 inline-flex min-h-[48px] items-center rounded-md bg-red-500 px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-red-600"
          >
            Empezar ahora
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
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-xl border border-line bg-surface p-6 shadow-[0_-12px_48px_rgba(0,0,0,0.6)] md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px] md:rounded-xl md:shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
            >
              {/* Header del asistente */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 font-display text-base font-extrabold text-white">
                    R
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Encuentra tu moto
                    </p>
                    {paso <= 4 && (
                      <p className="label-mono !text-[10px]">
                        Paso {paso} de 4
                      </p>
                    )}
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

              <AnimatePresence mode="wait">
                {paso === 1 && (
                  <motion.div key="paso-1" {...slideStep}>
                    <p className="mb-4 text-base font-medium text-white">
                      ¿Cuánto quieres invertir?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {RANGOS_PRESUPUESTO.map((r) => (
                        <Chip
                          key={r.etiqueta}
                          activo={presupuesto === r.etiqueta}
                          onClick={() => {
                            setPresupuesto(r.etiqueta);
                            setPaso(2);
                          }}
                        >
                          {r.etiqueta}
                        </Chip>
                      ))}
                    </div>
                  </motion.div>
                )}

                {paso === 2 && (
                  <motion.div key="paso-2" {...slideStep}>
                    <p className="mb-4 text-base font-medium text-white">
                      ¿Para qué la usarás?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {USOS.map((u) => (
                        <Chip
                          key={u}
                          activo={uso === u}
                          onClick={() => {
                            setUso(u);
                            setPaso(3);
                          }}
                        >
                          {u}
                        </Chip>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="label-mono mt-5 !text-[11px] transition-colors hover:!text-white"
                    >
                      ← Volver
                    </button>
                  </motion.div>
                )}

                {paso === 3 && (
                  <motion.div key="paso-3" {...slideStep}>
                    <p className="mb-4 text-base font-medium text-white">
                      ¿Cuánta experiencia tienes?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCIAS.map((e) => (
                        <Chip
                          key={e}
                          activo={experiencia === e}
                          onClick={() => {
                            setExperiencia(e);
                            setPaso(4);
                          }}
                        >
                          {e}
                        </Chip>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="label-mono mt-5 !text-[11px] transition-colors hover:!text-white"
                    >
                      ← Volver
                    </button>
                  </motion.div>
                )}

                {paso === 4 && (
                  <motion.div key="paso-4" {...slideStep}>
                    <p className="mb-4 text-base font-medium text-white">
                      Último paso: ¿a quién le mandamos la recomendación?
                    </p>
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="label-mono !text-[11px]">Nombre</span>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          autoComplete="name"
                          placeholder="Tu nombre"
                          className="min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="label-mono !text-[11px]">
                          WhatsApp
                        </span>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          autoComplete="tel"
                          placeholder="+56 9 ..."
                          className="min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
                        />
                      </label>
                      <p className="mt-1 text-sm font-medium text-white">
                        ¿Cuándo planeas comprar?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {URGENCIAS.map((u) => (
                          <Chip
                            key={u}
                            activo={urgencia === u}
                            onClick={() => setUrgencia(u)}
                          >
                            {u}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPaso(3)}
                        className="label-mono !text-[11px] transition-colors hover:!text-white"
                      >
                        ← Volver
                      </button>
                      <motion.button
                        type="button"
                        disabled={!puedeAvanzar4}
                        onClick={calcularResultado}
                        whileTap={{ scale: 0.97 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="inline-flex min-h-[44px] items-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Ver mi moto →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {paso === 5 && recomendada && (
                  <motion.div key="paso-5" {...slideStep}>
                    <p className="label-mono mb-3 !text-[11px]">
                      Tu recomendación {EMOJI_SCORE[score]}
                    </p>
                    <div className="overflow-hidden rounded-lg border border-line bg-surface-2">
                      <div className="flex aspect-[4/3] items-center justify-center bg-black">
                        <img
                          src={recomendada.img}
                          alt={`${recomendada.marca} ${recomendada.modelo}`}
                          width={340}
                          height={255}
                          loading="lazy"
                          className="h-full w-full object-contain p-4"
                        />
                      </div>
                      <div className="p-4">
                        <p className="label-mono !text-[10px]">
                          {recomendada.marca}
                        </p>
                        <h3 className="font-display text-xl font-bold uppercase text-white">
                          {recomendada.modelo}
                        </h3>
                        <p className="mt-1 font-display text-2xl font-extrabold text-red-500">
                          {formatCLP(precioVigente(recomendada))}
                        </p>
                      </div>
                    </div>
                    <motion.a
                      href={linkWhatsApp(mensajeWsp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.97 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-wsp text-sm font-semibold text-black transition-opacity duration-200 hover:opacity-90"
                    >
                      Cotizarla por WhatsApp
                    </motion.a>
                    <button
                      type="button"
                      onClick={reiniciar}
                      className="label-mono mt-4 !text-[11px] transition-colors hover:!text-white"
                    >
                      ↺ Empezar de nuevo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
