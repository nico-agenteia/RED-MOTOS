"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CATALOGO } from "@/lib/catalogo";

// TODO: conectar KIE_API_KEY en .env.local — sin la key, los endpoints
// /api/generar-post y /api/kie-status responden con un mensaje claro.

type Estilo = "catalogo" | "redes";

interface Resultado {
  imagenUrl: string;
  caption: string;
}

const POLL_MS = 3000;

export default function GeneradorPost() {
  const [motoId, setMotoId] = useState(CATALOGO[0].id);
  const [estilo, setEstilo] = useState<Estilo>("catalogo");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [captionCopiado, setCaptionCopiado] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const moto = CATALOGO.find((m) => m.id === motoId) ?? CATALOGO[0];

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function generar() {
    setError(null);
    setResultado(null);
    setGenerando(true);
    try {
      const res = await fetch("/api/generar-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motoId, estilo }),
      });
      const datos = await res.json().catch(() => null);

      if (!res.ok) {
        setError(datos?.error ?? "No se pudo iniciar la generación");
        setGenerando(false);
        return;
      }

      // Polling a /api/kie-status cada 3s hasta que la tarea termine.
      const taskId: string = datos.taskId;
      pollRef.current = setInterval(async () => {
        const estadoRes = await fetch(
          `/api/kie-status?taskId=${encodeURIComponent(taskId)}`,
        );
        const estado = await estadoRes.json().catch(() => null);
        if (!estadoRes.ok) {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(estado?.error ?? "Error consultando el estado");
          setGenerando(false);
          return;
        }
        if (estado?.estado === "listo") {
          if (pollRef.current) clearInterval(pollRef.current);
          setResultado({
            imagenUrl: estado.imagenUrl,
            caption: estado.caption,
          });
          setGenerando(false);
        }
      }, POLL_MS);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setGenerando(false);
    }
  }

  async function copiarCaption() {
    if (!resultado) return;
    await navigator.clipboard.writeText(resultado.caption);
    setCaptionCopiado(true);
    setTimeout(() => setCaptionCopiado(false), 2500);
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-bold uppercase text-white">
        Generador de posts
      </h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Elige una moto del catálogo, el estilo de la pieza, y la IA genera la
        imagen + caption listos para Instagram.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="label-mono !text-[11px]">Moto del catálogo</span>
            <select
              value={motoId}
              onChange={(e) => setMotoId(e.target.value)}
              className="min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white focus:border-red-500 focus:outline-none"
            >
              {CATALOGO.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.marca} {m.modelo}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="label-mono mb-2 !text-[11px]">Estilo</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Estilo del post">
              <button
                type="button"
                role="radio"
                aria-checked={estilo === "catalogo"}
                onClick={() => setEstilo("catalogo")}
                className={`min-h-[44px] rounded-md border px-4 text-sm font-medium transition-colors duration-200 ${
                  estilo === "catalogo"
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-line bg-surface-2 text-muted hover:text-white"
                }`}
              >
                🛒 Catálogo (fondo limpio)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={estilo === "redes"}
                onClick={() => setEstilo("redes")}
                className={`min-h-[44px] rounded-md border px-4 text-sm font-medium transition-colors duration-200 ${
                  estilo === "redes"
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-line bg-surface-2 text-muted hover:text-white"
                }`}
              >
                📱 Redes (cinematográfico)
              </button>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={generar}
            disabled={generando}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generando ? "Generando…" : "Generar con IA"}
          </motion.button>

          {error && (
            <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-line bg-surface-2 p-6">
          <p className="label-mono mb-4 !text-[11px]">Preview</p>

          {generando ? (
            <div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-lg bg-black">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-red-500" />
              <p className="text-sm text-muted">Procesando con IA…</p>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-surface">
                <span className="block h-full w-1/3 animate-marquee rounded-full bg-red-500" />
              </div>
            </div>
          ) : resultado ? (
            <div className="flex flex-col gap-4">
              <img
                src={resultado.imagenUrl}
                alt={`Post generado de ${moto.marca} ${moto.modelo}`}
                width={520}
                height={520}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <p className="whitespace-pre-wrap rounded-md bg-black p-4 text-sm text-white">
                {resultado.caption}
              </p>
              <div className="flex gap-3">
                <a
                  href={resultado.imagenUrl}
                  download
                  className="inline-flex min-h-[44px] items-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={copiarCaption}
                  className="inline-flex min-h-[44px] items-center rounded-md border border-line px-5 text-sm font-medium text-muted transition-colors duration-200 hover:border-white/25 hover:text-white"
                >
                  {captionCopiado ? "✓ Copiado" : "Copiar caption"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg bg-black">
              <img
                src={moto.img}
                alt={`${moto.marca} ${moto.modelo} — imagen de referencia`}
                width={420}
                height={420}
                loading="lazy"
                className="h-full w-full object-contain p-8 opacity-70"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
