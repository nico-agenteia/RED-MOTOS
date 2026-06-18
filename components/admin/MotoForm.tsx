"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [imagenesGaleria, setImagenesGaleria] = useState<{ nombre: string; url: string }[]>([]);
  const [cargandoGaleria, setCargandoGaleria] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  const cargarGaleria = useCallback(async () => {
    setCargandoGaleria(true);
    try {
      const res = await fetch("/api/storage/catalogo");
      const data = await res.json();
      setImagenesGaleria(data.imagenes ?? []);
    } catch { /* silenciar */ }
    setCargandoGaleria(false);
  }, []);

  async function subirArchivo(file: File) {
    setSubiendoArchivo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/storage/catalogo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setImagenUrl(data.url);
    } catch { /* silenciar */ }
    setSubiendoArchivo(false);
  }

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

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <div
          key="wrapper-motoform"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <motion.div
            key="scrim-motoform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
            aria-hidden="true"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            key="modal-motoform"
            role="dialog"
            aria-modal="true"
            aria-label={esEdicion ? "Editar moto del catálogo" : "Agregar moto al catálogo"}
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="relative z-10 mx-4 max-h-[85dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-line bg-[#111] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
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
              {/* ── Imagen ───────────────────────────── */}
              <div className="flex flex-col gap-2">
                <span className="label-mono !text-[11px]">Imagen</span>
                {imagenUrl ? (
                  <div className="relative w-full overflow-hidden rounded-lg border border-line bg-black">
                    <img
                      src={imagenUrl}
                      alt="Imagen seleccionada"
                      className="mx-auto h-40 object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setImagenUrl("")}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-500"
                      aria-label="Quitar imagen"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-line bg-surface-2 text-sm text-muted">
                    Sin imagen
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setGaleriaAbierta(true); cargarGaleria(); }}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md border border-line bg-surface-2 text-sm font-medium text-white transition-colors hover:border-red-500 hover:bg-red-500/10"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                    Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoArchivo}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md border border-line bg-surface-2 text-sm font-medium text-white transition-colors hover:border-red-500 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                    {subiendoArchivo ? "Subiendo…" : "Subir foto"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) subirArchivo(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                {errores.imagenUrl && <span className="text-xs text-red-500">{errores.imagenUrl}</span>}
              </div>

              {/* ── Galería modal ────────────────────── */}
              <AnimatePresence>
                {galeriaAbierta && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setGaleriaAbierta(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="relative mx-4 max-h-[80dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-[#111] p-5 shadow-2xl"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold uppercase text-white">
                          Elegir imagen del estudio
                        </h3>
                        <button
                          type="button"
                          onClick={() => setGaleriaAbierta(false)}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:text-white"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                      {cargandoGaleria ? (
                        <div className="flex h-40 items-center justify-center">
                          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-red-500" />
                        </div>
                      ) : imagenesGaleria.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">
                          No hay imágenes en el estudio. Procesa una foto en la sección &quot;Fotos&quot; primero.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                          {imagenesGaleria.map((img) => (
                            <button
                              key={img.nombre}
                              type="button"
                              onClick={() => { setImagenUrl(img.url); setGaleriaAbierta(false); }}
                              className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                imagenUrl === img.url
                                  ? "border-red-500 ring-2 ring-red-500/30"
                                  : "border-transparent hover:border-white/30"
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.nombre}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                loading="lazy"
                              />
                              {imagenUrl === img.url && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">Actual</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
