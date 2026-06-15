"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import MotoForm from "./MotoForm";
import EstudioFotos from "./EstudioFotos";
import BandejaLeads from "./BandejaLeads";
import { formatCLP } from "@/lib/utils";
import type { Moto } from "@/lib/tipos";

type Seccion = "stock" | "leads" | "fotos";

const POR_PAGINA = 8;

const SECCIONES: { id: Seccion; etiqueta: string }[] = [
  { id: "stock", etiqueta: "Stock" },
  { id: "leads", etiqueta: "Leads" },
  { id: "fotos", etiqueta: "Estudio de Fotos" },
];

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState<Seccion>("stock");
  const [motos, setMotos] = useState<Moto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [formAbierto, setFormAbierto] = useState(false);
  const [motoEditar, setMotoEditar] = useState<Moto | null>(null);
  const [imagenUrlDesdeEstudio, setImagenUrlDesdeEstudio] = useState<string | undefined>();

  const cargarMotos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/motos");
      const datos = await res.json();
      setMotos(datos.motos ?? []);
    } catch {
      setMotos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarMotos();
  }, [cargarMotos]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return motos;
    return motos.filter(
      (m) =>
        m.modelo.toLowerCase().includes(q) || m.marca.toLowerCase().includes(q),
    );
  }, [motos, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  async function eliminar(moto: Moto) {
    const confirmado = window.confirm(
      `¿Eliminar la ${moto.marca} ${moto.modelo} del catálogo?`,
    );
    if (!confirmado) return;
    await fetch(`/api/motos?id=${encodeURIComponent(moto.id)}`, {
      method: "DELETE",
    });
    void cargarMotos();
  }

  async function cerrarSesion() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="flex min-h-dvh bg-black">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface-2 p-6 md:flex">
        <p className="font-display text-xl font-extrabold uppercase tracking-wide text-white">
          Red Motos<span className="text-red-500">.</span>
        </p>
        <p className="label-mono mt-1 !text-[10px]">Panel admin</p>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Secciones del panel">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              aria-current={seccion === s.id ? "page" : undefined}
              className={`flex min-h-[44px] items-center rounded-md px-4 text-sm font-medium transition-colors duration-200 ${
                seccion === s.id
                  ? "bg-red-500 text-white"
                  : "text-muted hover:bg-surface hover:text-white"
              }`}
            >
              {s.etiqueta}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
          <div>
            <h1 className="font-display text-xl font-bold uppercase text-white">
              Panel Admin · Red Motos
            </h1>
            {/* Selector de sección en mobile */}
            <div className="mt-2 flex gap-2 md:hidden">
              {SECCIONES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeccion(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    seccion === s.id
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-line text-muted"
                  }`}
                >
                  {s.etiqueta}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="inline-flex min-h-[44px] items-center rounded-md border border-line px-4 text-sm font-medium text-muted transition-colors duration-200 hover:border-white/25 hover:text-white"
          >
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {seccion === "stock" && (
            <div>
              {/* Cards de métricas */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { etiqueta: "Total motos", valor: motos.length },
                  { etiqueta: "Con descuento", valor: motos.filter((m) => m.precioBono !== null).length },
                  { etiqueta: "Destacadas", valor: motos.filter((m) => m.destacado).length },
                  { etiqueta: "Marcas", valor: new Set(motos.map((m) => m.marca)).size },
                ].map((card) => (
                  <div key={card.etiqueta} className="rounded-xl border border-line bg-surface-2 p-4">
                    <p className="label-mono !text-[11px]">{card.etiqueta}</p>
                    <p className="font-display mt-1 text-3xl font-bold text-white">{card.valor}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-3xl font-bold uppercase text-white">
                  Stock ({filtradas.length})
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPagina(1);
                    }}
                    placeholder="Buscar marca o modelo…"
                    aria-label="Buscar en el stock"
                    className="min-h-[44px] w-56 rounded-md border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none"
                  />
                  <motion.button
                    type="button"
                    onClick={() => { setMotoEditar(null); setFormAbierto(true); }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="inline-flex min-h-[44px] items-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                  >
                    + Agregar Moto
                  </motion.button>
                </div>
              </div>

              {/* Tabla de motos */}
              <div className="mt-6 overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2">
                      <th className="label-mono px-4 py-3 !text-[10px]">Imagen</th>
                      <th className="label-mono px-4 py-3 !text-[10px]">Marca</th>
                      <th className="label-mono px-4 py-3 !text-[10px]">Modelo</th>
                      <th className="label-mono px-4 py-3 !text-[10px]">Precio</th>
                      <th className="label-mono px-4 py-3 !text-[10px]">Descuento</th>
                      <th className="label-mono px-4 py-3 !text-[10px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted">
                          Cargando stock…
                        </td>
                      </tr>
                    ) : visibles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted">
                          No hay motos que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      visibles.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-surface"
                        >
                          <td className="px-4 py-3">
                            <img
                              src={m.img}
                              alt={`${m.marca} ${m.modelo}`}
                              width={64}
                              height={48}
                              loading="lazy"
                              className="h-12 w-16 rounded-sm bg-surface-2 object-contain"
                            />
                          </td>
                          <td className="px-4 py-3 text-white">{m.marca}</td>
                          <td className="px-4 py-3 font-medium text-white">
                            {m.modelo}
                          </td>
                          <td className="px-4 py-3 font-mono text-white">
                            {formatCLP(m.precioBono ?? m.precioLista)}
                          </td>
                          <td className="px-4 py-3">
                            {m.precioBono !== null ? (
                              <span className="rounded-sm bg-red-500/15 px-2 py-1 font-mono text-[11px] text-red-500">
                                −{formatCLP(m.precioLista - m.precioBono)}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => { setMotoEditar(m); setFormAbierto(true); }}
                                className="inline-flex min-h-[36px] items-center rounded-md px-3 text-xs font-medium text-muted transition-colors duration-200 hover:bg-white/10 hover:text-white"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminar(m)}
                                className="inline-flex min-h-[36px] items-center rounded-md px-3 text-xs font-medium text-muted transition-colors duration-200 hover:bg-red-500/10 hover:text-red-500"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPagina((p) => p - 1)}
                    className="inline-flex min-h-[40px] items-center rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-white disabled:opacity-30"
                  >
                    ← Anterior
                  </button>
                  <span className="label-mono !text-[11px]">
                    {paginaActual} / {totalPaginas}
                  </span>
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina((p) => p + 1)}
                    className="inline-flex min-h-[40px] items-center rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-white disabled:opacity-30"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}

          {seccion === "leads" && <BandejaLeads />}
          {seccion === "fotos" && (
            <EstudioFotos
              onGuardarEnCatalogo={(url) => {
                setMotoEditar(null);
                setImagenUrlDesdeEstudio(url);
                setFormAbierto(true);
              }}
            />
          )}
        </main>
      </div>

      <MotoForm
        abierto={formAbierto}
        onCerrar={() => {
          setFormAbierto(false);
          setMotoEditar(null);
          setImagenUrlDesdeEstudio(undefined);
        }}
        onGuardada={() => void cargarMotos()}
        motoEditar={motoEditar}
        imagenUrlInicial={imagenUrlDesdeEstudio}
      />
    </div>
  );
}
