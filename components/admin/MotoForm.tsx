"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import type { Moto, Uso } from "@/lib/tipos";

const MARCAS = [
  "Royal Enfield",
  "Suzuki",
  "Kymco",
  "Zonsen",
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
  "Touring",
  "Motocross",
  "ATV",
  "UTV",
] as const;

const USOS_DISPONIBLES: Uso[] = ["Ciudad", "Ruta", "Off-road", "Trabajo", "Placer"];

const esquema = z.object({
  marca: z.enum(MARCAS, { message: "Elige una marca" }),
  segmento: z.enum(SEGMENTOS, { message: "Elige un segmento" }),
  modelo: z.string().min(2, "El modelo necesita al menos 2 caracteres"),
  precioLista: z.coerce
    .number({ message: "Precio inválido" })
    .int()
    .positive("El precio debe ser mayor a 0"),
  precioBono: z.coerce
    .number({ message: "Precio descuento inválido" })
    .int()
    .nonnegative("Debe ser positivo")
    .optional()
    .or(z.literal("")),
  bonoVence: z.string().optional().or(z.literal("")),
  imagenUrl: z
    .string()
    .optional()
    .or(z.literal("")),
  destacado: z.boolean().optional(),
  orden: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
});

type Errores = Partial<Record<keyof z.infer<typeof esquema>, string>>;

interface MotoFormProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardada: () => void;
  /** Si se pasa, el form opera en modo edición. */
  motoEditar?: Moto | null;
  /** Precarga la URL de imagen (útil al venir del Estudio de Fotos). */
  imagenUrlInicial?: string;
}

const claseInput =
  "min-h-[44px] rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none";

export default function MotoForm({
  abierto,
  onCerrar,
  onGuardada,
  motoEditar,
  imagenUrlInicial,
}: MotoFormProps) {
  const esEdicion = Boolean(motoEditar);

  const [marca, setMarca] = useState<string>("Royal Enfield");
  const [segmento, setSegmento] = useState<string>("Urbana");
  const [modelo, setModelo] = useState("");
  const [precioLista, setPrecioLista] = useState("");
  const [precioBono, setPrecioBono] = useState("");
  const [bonoVence, setBonoVence] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [destacado, setDestacado] = useState(false);
  const [orden, setOrden] = useState("");
  const [usos, setUsos] = useState<Uso[]>(["Ciudad"]);
  const [aptaPrincipiante, setAptaPrincipiante] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Precarga los datos cuando se edita o cuando llega una imagenUrlInicial
  useEffect(() => {
    if (motoEditar) {
      setMarca(motoEditar.marca);
      setSegmento(motoEditar.segmento);
      setModelo(motoEditar.modelo);
      setPrecioLista(String(motoEditar.precioLista));
      setPrecioBono(motoEditar.precioBono != null ? String(motoEditar.precioBono) : "");
      setBonoVence(motoEditar.bonoVence ?? "");
      setImagenUrl(motoEditar.img);
      setDestacado(motoEditar.destacado);
      setOrden(String(motoEditar.orden));
      setUsos(motoEditar.usos);
      setAptaPrincipiante(motoEditar.aptaPrincipiante);
    } else {
      setMarca("Royal Enfield");
      setSegmento("Urbana");
      setModelo("");
      setPrecioLista("");
      setPrecioBono("");
      setBonoVence("");
      setImagenUrl(imagenUrlInicial ?? "");
      setDestacado(false);
      setOrden("");
      setUsos(["Ciudad"]);
      setAptaPrincipiante(false);
    }
    setErrores({});
    setErrorGlobal(null);
  }, [motoEditar, imagenUrlInicial, abierto]);

  function toggleUso(uso: Uso) {
    setUsos((prev) =>
      prev.includes(uso) ? prev.filter((u) => u !== uso) : [...prev, uso],
    );
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorGlobal(null);

    const resultado = esquema.safeParse({
      marca,
      segmento,
      modelo,
      precioLista,
      precioBono,
      bonoVence,
      imagenUrl,
      destacado,
      orden,
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
      const body: Record<string, unknown> = {
        marca: d.marca,
        segmento: d.segmento,
        modelo: d.modelo,
        precioLista: d.precioLista,
        precioBono: d.precioBono === "" ? null : (d.precioBono ?? null),
        bonoVence: d.bonoVence === "" ? null : (d.bonoVence ?? null),
        imagenUrl: d.imagenUrl === "" ? undefined : d.imagenUrl,
        destacado: d.destacado ?? false,
        orden: d.orden === "" ? undefined : d.orden,
        usos,
        aptaPrincipiante,
      };

      if (esEdicion && motoEditar) {
        body.id = motoEditar.id;
      }

      const res = await fetch("/api/motos", {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const datos = await res.json().catch(() => null);
        setErrorGlobal(datos?.error ?? "No se pudo guardar la moto");
        return;
      }

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
            aria-label={esEdicion ? "Editar moto del catálogo" : "Agregar moto al catálogo"}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                {esEdicion ? "Editar moto" : "Agregar moto"}
              </h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar formulario"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
              {/* Marca + Segmento */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Marca</span>
                  <select value={marca} onChange={(e) => setMarca(e.target.value)} className={claseInput}>
                    {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errores.marca && <span className="text-xs text-red-500">{errores.marca}</span>}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Segmento</span>
                  <select value={segmento} onChange={(e) => setSegmento(e.target.value)} className={claseInput}>
                    {SEGMENTOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errores.segmento && <span className="text-xs text-red-500">{errores.segmento}</span>}
                </label>
              </div>

              {/* Modelo */}
              <label className="flex flex-col gap-1">
                <span className="label-mono !text-[11px]">Modelo</span>
                <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej: Hunter 350" className={claseInput} />
                {errores.modelo && <span className="text-xs text-red-500">{errores.modelo}</span>}
              </label>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Precio lista (CLP)</span>
                  <input type="number" value={precioLista} onChange={(e) => setPrecioLista(e.target.value)} placeholder="3499900" className={claseInput} />
                  {errores.precioLista && <span className="text-xs text-red-500">{errores.precioLista}</span>}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Precio descuento (CLP, opcional)</span>
                  <input type="number" value={precioBono} onChange={(e) => setPrecioBono(e.target.value)} placeholder="3199900" className={claseInput} />
                  {errores.precioBono && <span className="text-xs text-red-500">{errores.precioBono}</span>}
                </label>
              </div>

              {/* Vigencia bono */}
              {precioBono !== "" && (
                <label className="flex flex-col gap-1">
                  <span className="label-mono !text-[11px]">Vence el descuento (opcional)</span>
                  <input type="date" value={bonoVence} onChange={(e) => setBonoVence(e.target.value)} className={claseInput} />
                </label>
              )}

              {/* URL imagen */}
              <label className="flex flex-col gap-1">
                <span className="label-mono !text-[11px]">URL de imagen</span>
                <input type="text" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="/motos/Hunter350.png o https://…" className={claseInput} />
                {errores.imagenUrl && <span className="text-xs text-red-500">{errores.imagenUrl}</span>}
              </label>

              {/* Usos */}
              <div>
                <p className="label-mono mb-2 !text-[11px]">Usos recomendados</p>
                <div className="flex flex-wrap gap-2">
                  {USOS_DISPONIBLES.map((uso) => (
                    <button
                      key={uso}
                      type="button"
                      onClick={() => toggleUso(uso)}
                      aria-pressed={usos.includes(uso)}
                      className={`min-h-[36px] rounded-full border px-4 text-xs font-medium transition-colors duration-200 ${
                        usos.includes(uso)
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-line bg-surface-2 text-muted hover:text-white"
                      }`}
                    >
                      {uso}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles: apta principiante + destacado */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-line bg-surface-2 px-4">
                  <input
                    type="checkbox"
                    checked={aptaPrincipiante}
                    onChange={(e) => setAptaPrincipiante(e.target.checked)}
                    className="h-4 w-4 accent-red-500"
                  />
                  <span className="text-sm text-white">Apta principiante</span>
                </label>

                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-line bg-surface-2 px-4">
                  <input
                    type="checkbox"
                    checked={destacado}
                    onChange={(e) => setDestacado(e.target.checked)}
                    className="h-4 w-4 accent-red-500"
                  />
                  <span className="text-sm text-white">Destacada (showcase)</span>
                </label>
              </div>

              {/* Orden */}
              <label className="flex flex-col gap-1">
                <span className="label-mono !text-[11px]">Orden en catálogo (0 = primero)</span>
                <input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} placeholder="0" className={`${claseInput} w-32`} />
                {errores.orden && <span className="text-xs text-red-500">{errores.orden}</span>}
              </label>

              {errorGlobal && (
                <p role="alert" className="text-sm text-red-500">{errorGlobal}</p>
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
                  {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Agregar moto"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
