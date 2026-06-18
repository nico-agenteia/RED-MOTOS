"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import MotoForm from "./MotoForm";
import EstudioFotos from "./EstudioFotos";
import BandejaLeads from "./BandejaLeads";
import BandejaSolicitudes from "./BandejaSolicitudes";
import { formatCLP } from "@/lib/utils";
import type { Moto } from "@/lib/tipos";

type Seccion = "stock" | "leads" | "solicitudes" | "fotos";

const POR_PAGINA = 8;

const SECCIONES: { id: Seccion; etiqueta: string; icono: string }[] = [
  { id: "stock", etiqueta: "Stock", icono: "📦" },
  { id: "leads", etiqueta: "Leads", icono: "🎯" },
  { id: "solicitudes", etiqueta: "Solicitudes", icono: "💰" },
  { id: "fotos", etiqueta: "Fotos", icono: "📷" },
];

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState<Seccion>("stock");
  const [motos, setMotos] = useState<Moto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [formAbierto, setFormAbierto] = useState(false);
  const [motoEditar, setMotoEditar] = useState<Moto | null>(null);
  const [imagenUrlDesdeEstudio, setImagenUrlDesdeEstudio] = useState<
    string | undefined
  >();

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

  async function toggleStock(moto: Moto) {
    const nuevo = !moto.sinStock;
    await fetch(
      `/api/motos?id=${encodeURIComponent(moto.id)}&sinStock=${nuevo}`,
      { method: "PATCH" },
    );
    setMotos((prev) =>
      prev.map((m) => (m.id === moto.id ? { ...m, sinStock: nuevo } : m)),
    );
  }

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
    <div className="flex min-h-dvh flex-col bg-black md:flex-row">
      {/* ── Sidebar desktop ────────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface-2 p-6 md:flex">
        <img
          src="/logos/red-motos-logo.webp"
          alt="Red Motos Chile"
          className="h-16 w-auto"
        />
        <p className="label-mono mt-2 !text-[10px]">Panel admin</p>
        <nav
          className="mt-10 flex flex-col gap-1"
          aria-label="Secciones del panel"
        >
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              aria-current={seccion === s.id ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-200 ${
                seccion === s.id
                  ? "bg-red-500 text-white"
                  : "text-muted hover:bg-surface hover:text-white"
              }`}
            >
              <span aria-hidden="true">{s.icono}</span>
              {s.etiqueta}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Contenido principal ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <img
              src="/logos/red-motos-logo.webp"
              alt="Red Motos"
              className="h-8 w-auto md:hidden"
            />
            <h1 className="font-display text-base font-bold uppercase text-white md:text-xl">
              <span className="hidden md:inline">Panel Admin · </span>Red Motos
            </h1>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="inline-flex min-h-[44px] items-center rounded-md border border-line px-3 text-xs font-medium text-muted transition-colors duration-200 hover:border-white/25 hover:text-white md:px-4 md:text-sm"
          >
            Salir
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {seccion === "stock" && (
            <div>
              {/* Métricas */}
              <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
                {[
                  { etiqueta: "Total motos", valor: motos.length },
                  {
                    etiqueta: "Con descuento",
                    valor: motos.filter((m) => m.precioBono !== null).length,
                  },
                  {
                    etiqueta: "Destacadas",
                    valor: motos.filter((m) => m.destacado).length,
                  },
                  {
                    etiqueta: "Sin stock",
                    valor: motos.filter((m) => m.sinStock).length,
                  },
                ].map((card) => (
                  <div
                    key={card.etiqueta}
                    className="rounded-xl border border-line bg-surface-2 p-3 md:p-4"
                  >
                    <p className="label-mono !text-[10px] md:!text-[11px]">
                      {card.etiqueta}
                    </p>
                    <p className="font-display mt-1 text-2xl font-bold text-white md:text-3xl">
                      {card.valor}
                    </p>
                  </div>
                ))}
              </div>

              {/* Barra de acciones */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="font-display text-2xl font-bold uppercase text-white md:text-3xl">
                  Stock ({filtradas.length})
                </h2>
                <div className="flex gap-2">
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPagina(1);
                    }}
                    placeholder="Buscar…"
                    aria-label="Buscar en el stock"
                    className="min-h-[44px] min-w-0 flex-1 rounded-md border border-line bg-surface-2 px-3 text-sm text-white placeholder:text-muted/60 focus:border-red-500 focus:outline-none md:w-56 md:flex-none md:px-4"
                  />
                  <motion.button
                    type="button"
                    onClick={() => {
                      setMotoEditar(null);
                      setFormAbierto(true);
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="inline-flex min-h-[44px] shrink-0 items-center rounded-md bg-red-500 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 md:px-5"
                  >
                    + Agregar
                  </motion.button>
                </div>
              </div>

              {/* ── Tabla desktop ─────────────────────────────────────── */}
              <div className="mt-6 hidden overflow-x-auto rounded-xl border border-line md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2">
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Imagen
                      </th>
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Marca
                      </th>
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Modelo
                      </th>
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Precio
                      </th>
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Descuento
                      </th>
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Stock
                      </th>
                      <th className="label-mono px-4 py-3 !text-[10px]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-muted"
                        >
                          Cargando stock…
                        </td>
                      </tr>
                    ) : visibles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-muted"
                        >
                          No hay motos que coincidan.
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
                            <button
                              type="button"
                              onClick={() => toggleStock(m)}
                              className={`inline-flex min-h-[32px] items-center rounded-full px-3 text-[11px] font-semibold transition-colors duration-200 ${
                                m.sinStock
                                  ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                                  : "bg-green-600/15 text-green-400 hover:bg-green-600/25"
                              }`}
                            >
                              {m.sinStock ? "Sin stock" : "En stock"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setMotoEditar(m);
                                  setFormAbierto(true);
                                }}
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

              {/* ── Cards mobile ──────────────────────────────────────── */}
              <div className="mt-4 flex flex-col gap-3 md:hidden">
                {cargando ? (
                  <p className="py-12 text-center text-muted">
                    Cargando stock…
                  </p>
                ) : visibles.length === 0 ? (
                  <p className="py-12 text-center text-muted">
                    No hay motos que coincidan.
                  </p>
                ) : (
                  visibles.map((m) => (
                    <div
                      key={m.id}
                      className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3"
                    >
                      <img
                        src={m.img}
                        alt={`${m.marca} ${m.modelo}`}
                        width={80}
                        height={60}
                        loading="lazy"
                        className="h-16 w-20 shrink-0 rounded-md bg-surface object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted">{m.marca}</p>
                        <p className="truncate font-medium text-white">
                          {m.modelo}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-sm text-white">
                            {formatCLP(m.precioBono ?? m.precioLista)}
                          </span>
                          {m.precioBono !== null && (
                            <span className="rounded-sm bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] text-red-500">
                              −{formatCLP(m.precioLista - m.precioBono)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStock(m)}
                            className={`min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors duration-200 ${
                              m.sinStock
                                ? "bg-red-500/15 text-red-400"
                                : "bg-green-600/15 text-green-400"
                            }`}
                          >
                            {m.sinStock ? "Sin stock" : "En stock"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMotoEditar(m);
                              setFormAbierto(true);
                            }}
                            className="min-h-[36px] rounded-md border border-line px-3 text-xs font-medium text-muted transition-colors hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminar(m)}
                            className="min-h-[36px] rounded-md px-3 text-xs font-medium text-red-500/70 transition-colors hover:text-red-500"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="mt-4 flex items-center justify-between gap-2 md:justify-end">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPagina((p) => p - 1)}
                    className="inline-flex min-h-[44px] items-center rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-white disabled:opacity-30"
                  >
                    ←
                  </button>
                  <span className="label-mono !text-[11px]">
                    {paginaActual} / {totalPaginas}
                  </span>
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina((p) => p + 1)}
                    className="inline-flex min-h-[44px] items-center rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-white disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}

          {seccion === "leads" && <BandejaLeads />}
          {seccion === "solicitudes" && <BandejaSolicitudes />}
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

      {/* ── Bottom nav mobile ──────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur-lg md:hidden"
        aria-label="Navegación del panel"
      >
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSeccion(s.id)}
            aria-current={seccion === s.id ? "page" : undefined}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              seccion === s.id ? "text-red-500" : "text-muted"
            }`}
          >
            <span className="text-lg" aria-hidden="true">
              {s.icono}
            </span>
            {s.etiqueta}
          </button>
        ))}
      </nav>

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
