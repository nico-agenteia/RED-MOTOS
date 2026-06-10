"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const MARCAS = [
  "Royal Enfield",
  "Suzuki",
  "Kymco",
  "Keeway",
  "Zontes",
  "Voge",
  "Cyclone",
] as const;

const SEGMENTOS = [
  "Urbana",
  "Deportiva",
  "Adventure",
  "Off-road",
  "Cruiser",
  "Scrambler",
  "Custom",
  "Scooter",
  "Naked",
] as const;

const esquema = z.object({
  marca: z.enum(MARCAS, { message: "Elige una marca" }),
  segmento: z.enum(SEGMENTOS, { message: "Elige un segmento" }),
  modelo: z.string().min(2, "El modelo necesita al menos 2 caracteres"),
  anio: z.coerce
    .number({ message: "Año inválido" })
    .int()
    .min(2015, "Año mínimo 2015")
    .max(2030, "Año máximo 2030"),
  precioLista: z.coerce
    .number({ message: "Precio inválido" })
    .int()
    .positive("El precio debe ser mayor a 0"),
  bono: z.coerce
    .number({ message: "Bono inválido" })
    .int()
    .nonnegative("El bono no puede ser negativo")
    .optional()
    .or(z.literal("")),
  imagenUrl: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

type Errores = Partial<Record<keyof z.infer<typeof esquema>, string>>;

interface MotoFormProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardada: () => void;
}

const claseInput =
  "min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none";

export default function MotoForm({
  abierto,
  onCerrar,
  onGuardada,
}: MotoFormProps) {
  const [marca, setMarca] = useState<string>("Royal Enfield");
  const [segmento, setSegmento] = useState<string>("Urbana");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("2026");
  const [precioLista, setPrecioLista] = useState("");
  const [bono, setBono] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorGlobal(null);

    const resultado = esquema.safeParse({
      marca,
      segmento,
      modelo,
      anio,
      precioLista,
      bono,
      imagenUrl,
    });

    if (!resultado.success) {
      const planos = resultado.error.flatten().fieldErrors;
      const nuevos: Errores = {};
      (Object.keys(planos) as (keyof Errores)[]).forEach((k) => {
        const msj = planos[k]?.[0];
        if (msj) nuevos[k] = msj;
      });
      setErrores(nuevos);
      return;
    }

    setErrores({});
    setGuardando(true);
    try {
      const d = resultado.data;
      const res = await fetch("/api/motos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marca: d.marca,
          segmento: d.segmento,
          modelo: d.modelo,
          anio: d.anio,
          precioLista: d.precioLista,
          bono: d.bono === "" ? undefined : d.bono,
          imagenUrl: d.imagenUrl === "" ? undefined : d.imagenUrl,
        }),
      });
      if (!res.ok) {
        const datos = await res.json().catch(() => null);
        setErrorGlobal(datos?.error ?? "No se pudo guardar la moto");
        return;
      }
      setModelo("");
      setPrecioLista("");
      setBono("");
      setImagenUrl("");
      onGuardada();
      onCerrar();
    } catch {
      setErrorGlobal("Error de conexión. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            key="scrim-motoform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            key="modal-motoform"
            role="dialog"
            aria-modal="true"
            aria-label="Agregar moto al catálogo"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Agregar moto
              </h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar formulario"
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

            <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Marca</span>
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className={claseInput}
                  >
                    {MARCAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {errores.marca && (
                    <span className="text-xs text-red-500">{errores.marca}</span>
                  )}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Segmento</span>
                  <select
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    className={claseInput}
                  >
                    {SEGMENTOS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errores.segmento && (
                    <span className="text-xs text-red-500">
                      {errores.segmento}
                    </span>
                  )}
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="label-mono !text-[11px]">Modelo</span>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ej: Hunter 350"
                  className={claseInput}
                />
                {errores.modelo && (
                  <span className="text-xs text-red-500">{errores.modelo}</span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Año</span>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className={claseInput}
                  />
                  {errores.anio && (
                    <span className="text-xs text-red-500">{errores.anio}</span>
                  )}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">
                    Precio lista (CLP)
                  </span>
                  <input
                    type="number"
                    value={precioLista}
                    onChange={(e) => setPrecioLista(e.target.value)}
                    placeholder="3499900"
                    className={claseInput}
                  />
                  {errores.precioLista && (
                    <span className="text-xs text-red-500">
                      {errores.precioLista}
                    </span>
                  )}
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="label-mono !text-[11px]">
                  Bono / descuento (CLP, opcional)
                </span>
                <input
                  type="number"
                  value={bono}
                  onChange={(e) => setBono(e.target.value)}
                  placeholder="300000"
                  className={claseInput}
                />
                {errores.bono && (
                  <span className="text-xs text-red-500">{errores.bono}</span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="label-mono !text-[11px]">
                  URL de imagen (opcional)
                </span>
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://…"
                  className={claseInput}
                />
                {errores.imagenUrl && (
                  <span className="text-xs text-red-500">
                    {errores.imagenUrl}
                  </span>
                )}
              </label>

              {errorGlobal && (
                <p role="alert" className="text-sm text-red-500">
                  {errorGlobal}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="inline-flex min-h-[44px] items-center rounded-md border border-line px-5 text-sm font-medium text-muted transition-colors duration-200 hover:border-white/25 hover:text-white"
                >
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  disabled={guardando}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-flex min-h-[44px] items-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {guardando ? "Guardando…" : "Guardar moto"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
