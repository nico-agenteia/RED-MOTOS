"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

// TODO: conectar KIE_API_KEY en .env.local — sin la key, el endpoint
// /api/procesar-imagen responde con un mensaje claro y este componente
// lo muestra sin romperse.

type Estilo = "catalogo" | "redes";

const POLL_MS = 3000;

export default function EstudioFotos() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [estilo, setEstilo] = useState<Estilo>("catalogo");
  const [arrastrando, setArrastrando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultadoUrl, setResultadoUrl] = useState<string | null>(null);

  function cargarArchivo(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }
    setError(null);
    setResultadoUrl(null);
    setArchivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function procesar() {
    if (!archivo) return;
    setError(null);
    setProcesando(true);
    try {
      const formData = new FormData();
      formData.append("foto", archivo);
      formData.append("estilo", estilo);

      const res = await fetch("/api/procesar-imagen", {
        method: "POST",
        body: formData,
      });
      const datos = await res.json().catch(() => null);

      if (!res.ok) {
        setError(datos?.error ?? "No se pudo procesar la imagen");
        setProcesando(false);
        return;
      }

      // Polling cada 3s al estado de la tarea (patrón async kie.ai).
      const taskId: string = datos.taskId;
      pollRef.current = setInterval(async () => {
        const estadoRes = await fetch(
          `/api/kie-status?taskId=${encodeURIComponent(taskId)}`,
        );
        const estado = await estadoRes.json().catch(() => null);
        if (!estadoRes.ok) {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(estado?.error ?? "Error consultando el estado");
          setProcesando(false);
          return;
        }
        if (estado?.estado === "listo") {
          if (pollRef.current) clearInterval(pollRef.current);
          setResultadoUrl(estado.imagenUrl);
          setProcesando(false);
        }
      }, POLL_MS);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setProcesando(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-bold uppercase text-white">
        Estudio de fotos
      </h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Sube la foto cruda de una moto recién llegada, elige el estilo, y la
        IA la devuelve lista para el catálogo o para redes.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          {/* Dropzone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Subir foto de la moto (arrastra o haz clic)"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              const file = e.dataTransfer.files?.[0];
              if (file) cargarArchivo(file);
            }}
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 ${
              arrastrando
                ? "border-red-500 bg-red-500/5"
                : "border-line bg-surface-2 hover:border-white/25"
            }`}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A1A1AA"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <p className="text-sm font-medium text-white">
              {archivo ? archivo.name : "Arrastra la foto cruda aquí"}
            </p>
            <p className="text-xs text-muted">o haz clic para elegirla</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) cargarArchivo(file);
              }}
            />
          </div>

          <div>
            <p className="label-mono mb-2 !text-[11px]">Estilo</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Estilo de procesamiento">
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
                🛒 Catálogo
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
                📱 Redes
              </button>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={procesar}
            disabled={!archivo || procesando}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {procesando ? "Procesando…" : "Procesar con IA"}
          </motion.button>

          {error && (
            <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </p>
          )}
        </div>

        {/* Preview / resultado */}
        <div className="rounded-xl border border-line bg-surface-2 p-6">
          <p className="label-mono mb-4 !text-[11px]">
            {resultadoUrl ? "Resultado" : "Foto subida"}
          </p>
          {procesando ? (
            <div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-lg bg-black">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-red-500" />
              <p className="text-sm text-muted">La IA está trabajando…</p>
            </div>
          ) : resultadoUrl ? (
            <div className="flex flex-col gap-4">
              <img
                src={resultadoUrl}
                alt="Foto procesada por IA"
                width={520}
                height={520}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
              >
                Guardar al catálogo
              </button>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview de la foto subida"
              width={520}
              height={520}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg bg-black">
              <p className="px-8 text-center text-sm text-muted">
                Aquí verás la foto antes y después del procesamiento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
