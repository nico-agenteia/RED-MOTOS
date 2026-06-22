"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ClienteFeliz } from "@/lib/tipos";

export default function ClientesFelices() {
  const [galeria, setGaleria] = useState<ClienteFeliz[]>([]);
  const [cargando, setCargando] = useState(true);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/clientes-felices");
      const datos = await res.json();
      setGaleria(datos.clientes ?? []);
    } catch {
      setGaleria([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function elegir(f: File | null) {
    setArchivo(f);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function publicar() {
    if (!archivo || subiendo) return;
    setSubiendo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("foto", archivo);
      if (nombre.trim()) fd.append("nombre", nombre.trim());
      if (marca.trim()) fd.append("marca", marca.trim());
      if (modelo.trim()) fd.append("modelo", modelo.trim());

      const res = await fetch("/api/clientes-felices", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo publicar la foto.");
        return;
      }
      // Reset + recargar galería.
      elegir(null);
      setNombre("");
      setMarca("");
      setModelo("");
      if (fileRef.current) fileRef.current.value = "";
      void cargar();
    } catch {
      setError("Problema de conexión. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  async function toggleActivo(c: ClienteFeliz) {
    await fetch(`/api/clientes-felices?id=${encodeURIComponent(c.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !c.activo }),
    });
    setGaleria((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, activo: !c.activo } : x)),
    );
  }

  async function borrar(c: ClienteFeliz) {
    if (!window.confirm("¿Borrar esta foto de la galería?")) return;
    await fetch(`/api/clientes-felices?id=${encodeURIComponent(c.id)}`, {
      method: "DELETE",
    });
    setGaleria((prev) => prev.filter((x) => x.id !== c.id));
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-2xl font-bold uppercase text-white md:text-3xl">
        Clientes felices
      </h2>
      <p className="mt-1 max-w-lg text-sm text-muted">
        Sube la foto del cliente al momento de la compra. Le componemos el marco de
        Red Motos y aparece en “Nuestros Clientes” del sitio.
      </p>

      {/* Subida */}
      <div className="mt-5 grid gap-4 rounded-xl border border-line bg-surface-2 p-4 md:grid-cols-[200px_1fr] md:p-6">
        {/* Dropzone / preview */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-surface text-center transition-colors hover:border-white/25"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-xs text-muted">
              Toca para elegir la foto del cliente
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => elegir(e.target.files?.[0] ?? null)}
        />

        <div className="flex flex-col gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del cliente (opcional)"
            className="min-h-[44px] rounded-md border border-line bg-surface px-3 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Marca (opcional)"
              className="min-h-[44px] rounded-md border border-line bg-surface px-3 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
            />
            <input
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Modelo (opcional)"
              className="min-h-[44px] rounded-md border border-line bg-surface px-3 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={publicar}
            disabled={!archivo || subiendo}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {subiendo ? "Componiendo…" : "Publicar con marco"}
          </button>
          <p className="text-xs text-muted/70">
            Acepta JPG, PNG y HEIC (iPhone). Se compone en formato 4:5.
          </p>
        </div>
      </div>

      {/* Galería */}
      <div className="mt-8">
        <p className="label-mono mb-3">
          Publicadas ({galeria.filter((c) => c.activo).length} activas)
        </p>
        {cargando ? (
          <p className="py-8 text-center text-muted">Cargando…</p>
        ) : galeria.length === 0 ? (
          <p className="py-8 text-center text-muted">
            Aún no hay clientes cargados. La web muestra las 20 fotos históricas
            hasta que subas la primera.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {galeria.map((c) => (
              <div
                key={c.id}
                className={`overflow-hidden rounded-lg border border-line bg-surface-2 ${
                  c.activo ? "" : "opacity-40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imgUrl}
                  alt={c.nombre ?? "Cliente Red Motos"}
                  loading="lazy"
                  className="aspect-[4/5] w-full bg-black object-cover"
                />
                <div className="p-2">
                  {(c.nombre || c.marca) && (
                    <p className="truncate text-xs text-white">
                      {c.nombre}
                      {c.marca ? ` · ${[c.marca, c.modelo].filter(Boolean).join(" ")}` : ""}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleActivo(c)}
                      className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                        c.activo
                          ? "bg-green-600/15 text-green-400 hover:bg-green-600/25"
                          : "bg-surface text-muted hover:text-white"
                      }`}
                    >
                      {c.activo ? "Activa" : "Oculta"}
                    </button>
                    <a
                      href={c.imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center rounded-md border border-line px-2 text-[11px] text-muted transition-colors hover:text-white"
                      title="Descargar / ver"
                    >
                      ↓
                    </a>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => void borrar(c)}
                      className="rounded-md border border-line px-2 text-[11px] text-red-500/70 transition-colors hover:text-red-500"
                      title="Borrar"
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
