"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CATALOGO } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/config";
import { FICHAS, type FichaTecnica } from "@/lib/fichas";
import { precioVigente } from "@/lib/catalogo";
import type { Moto } from "@/lib/tipos";
import SimuladorInline from "@/components/SimuladorInline";

function mensajeCotizacion(moto: Moto): string {
  return `Hola! Vengo de la web de Red Motos. Me interesa la ${moto.marca} ${moto.modelo}. ¿Me pueden dar información y cotización?`;
}

// Un valor de ficha cuenta como "presente" si no es vacío. "—" se considera
// presente pero se renderiza tenue (dato no disponible, no oculto).
function tieneValor(v?: string): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// ─── Mapa de colores (nombre → swatch) ───────────────────────────────────────
// Heurística simple por coincidencia parcial; fallback neutro si no calza.
const COLOR_SWATCH: Array<[RegExp, string]> = [
  [/negr|black|midnight|stealth|onyx|dark/i, "#1a1a1a"],
  [/blanc|white|silver|plata|plate|chrome|cromo/i, "#d4d4d4"],
  [/gris|grey|gray|granite|titanium|gunmetal|ceniza/i, "#6b6b6b"],
  [/roj|red|fireball|crimson|cherry|scarlet/i, "#dc2626"],
  [/azul|blue|navy|sky|teal|petrol|aqua/i, "#2563eb"],
  [/verd|green|olive|forest|sage|emerald/i, "#16a34a"],
  [/amarill|yellow|gold|dorad|sand|desert|mustard/i, "#d4a017"],
  [/naranj|orange|copper|cobre|amber|bronze/i, "#ea580c"],
  [/marr[oó]n|brown|tan|bronze|sepia|coffee/i, "#92400e"],
  [/morad|purpl|violet|lavand|plum/i, "#7c3aed"],
  [/rosa|pink|magenta|coral/i, "#db2777"],
];

function swatchHex(nombre: string): string {
  for (const [re, hex] of COLOR_SWATCH) {
    if (re.test(nombre)) return hex;
  }
  return "#737373"; // neutro
}

// ─── Iconos (SVG inline, monocromos, heredan currentColor) ───────────────────
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconMotor() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}
function IconTransmision() {
  return (
    <svg {...iconProps}>
      <circle cx="6.5" cy="17.5" r="3" />
      <circle cx="17.5" cy="17.5" r="3" />
      <path d="M9.5 17.5h5M8 15 12 7h3M15 7l1.8 8" />
    </svg>
  );
}
function IconFrenos() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </svg>
  );
}
function IconSuspension() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v3M12 18v3" />
      <path d="M9 6h6M9 18h6M10 7l4 2-4 2 4 2-4 2 4 2" />
    </svg>
  );
}
function IconRuedas() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3.5v6M12 14.5v6M3.5 12h6M14.5 12h6" />
    </svg>
  );
}
function IconDimensiones() {
  return (
    <svg {...iconProps}>
      <path d="M3 7h18M3 7v3M21 7v3M7 7v2M11 7v2M15 7v2M19 7v2" />
      <path d="M5 14h14a1 1 0 0 1 1 1v3H4v-3a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function IconCapacidades() {
  return (
    <svg {...iconProps}>
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12" />
      <path d="M15 8h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-3 0v-3" />
      <path d="M7 8h6" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ─── Tarjeta hermana ─────────────────────────────────────────────────────────
function CardHermana({ moto }: { moto: Moto }) {
  return (
    <Link
      href={`/modelo/${moto.id}`}
      className="group block overflow-hidden rounded-xl border border-line bg-surface-2 transition-all duration-300 hover:border-white/25 hover:shadow-[0_16px_32px_rgba(0,0,0,0.4)]"
      aria-label={`Ver ${moto.marca} ${moto.modelo}`}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[hsl(0,0%,8%)] overflow-hidden">
        <img
          src={moto.img}
          alt={`${moto.marca} ${moto.modelo}`}
          width={320}
          height={240}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        {moto.precioBono !== null && (
          <span className="absolute left-3 top-3 rounded-sm bg-red-500 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-white">
            Descuento
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="label-mono !text-[10px] mb-0.5">{moto.marca}</p>
        <h3 className="font-display text-lg font-bold uppercase text-white leading-tight">
          {moto.modelo}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          {moto.precioBono !== null ? (
            <>
              <span className="text-xs text-muted line-through">
                {formatCLP(moto.precioLista)}
              </span>
              <span className="font-display text-xl font-extrabold text-red-500">
                {formatCLP(moto.precioBono)}
              </span>
            </>
          ) : (
            <span className="font-display text-xl font-extrabold text-white">
              {formatCLP(moto.precioLista)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Variantes Framer Motion ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerTight = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Grupo de ficha (card con filas etiqueta/valor) ──────────────────────────
type GrupoFicha = {
  titulo: string;
  icono: ReactNode;
  filas: Array<[string, string | undefined]>;
};

function buildGrupos(f: FichaTecnica): GrupoFicha[] {
  const grupos: GrupoFicha[] = [
    {
      titulo: "Motor",
      icono: <IconMotor />,
      filas: [
        ["Tipo", f.motor],
        ["Cilindrada", f.cilindrada],
        ["Potencia", f.potencia],
        ["Torque", f.torque],
      ],
    },
    {
      titulo: "Transmisión",
      icono: <IconTransmision />,
      filas: [["Caja de cambios", f.transmision]],
    },
    {
      titulo: "Frenos / ABS",
      icono: <IconFrenos />,
      filas: [
        ["Frenos", f.frenos],
        ["ABS", f.abs],
      ],
    },
    {
      titulo: "Suspensión",
      icono: <IconSuspension />,
      filas: [
        ["Delantera", f.suspensionDel],
        ["Trasera", f.suspensionTras],
      ],
    },
    {
      titulo: "Ruedas",
      icono: <IconRuedas />,
      filas: [
        ["Neumático del.", f.neumaticoDel],
        ["Neumático tras.", f.neumaticoTras],
      ],
    },
    {
      titulo: "Dimensiones / Peso",
      icono: <IconDimensiones />,
      filas: [
        ["Largo", f.largo],
        ["Altura asiento", f.alturaAsiento],
        ["Peso", f.peso],
      ],
    },
    {
      titulo: "Capacidades",
      icono: <IconCapacidades />,
      filas: [["Estanque", f.estanque]],
    },
  ];
  // Solo grupos con al menos una fila con valor real.
  return grupos
    .map((g) => ({ ...g, filas: g.filas.filter(([, v]) => tieneValor(v)) }))
    .filter((g) => g.filas.length > 0);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ModeloDetalle({ moto }: { moto: Moto }) {
  const ficha = FICHAS[moto.id];
  const grupos = ficha ? buildGrupos(ficha) : [];

  // ── Hermanos de misma marca ───────────────────────────────────────────────
  const hermanos = CATALOGO.filter(
    (m) => m.marca === moto.marca && m.id !== moto.id,
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-[72px]">
      {/* ── Volver al catálogo (salida visible arriba) ──────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8">
        <Link
          href="/#catalogo"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-white"
        >
          ← Volver al catálogo
        </Link>
      </div>

      {/* ── Imagen principal ────────────────────────────────────────────────── */}
      <section
        aria-label={`Imagen de ${moto.marca} ${moto.modelo}`}
        className="relative bg-[#0A0A0A] py-12"
      >
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-[hsl(0,0%,6%)] p-4 md:p-8">
            <img
              src={moto.img}
              alt={`${moto.marca} ${moto.modelo}`}
              width={1280}
              height={960}
              className="mx-auto h-auto w-full object-contain"
            />

            {moto.precioBono !== null && (
              <span className="absolute left-5 top-5 rounded-sm bg-red-500 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white">
                Descuento
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto max-w-4xl px-4 py-10 md:px-8"
        aria-label="Información del modelo"
      >
        <motion.p variants={fadeUp} className="label-mono mb-2 !text-[13px] text-red-500">
          {moto.marca}
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="headline-display text-white leading-none"
          style={{ fontSize: "clamp(40px, 8vw, 88px)" }}
        >
          {moto.modelo}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 text-muted text-lg">
          {moto.segmento} · {moto.cc} cc
        </motion.p>

        {/* Descripción + chips rápidos (solo si hay ficha) */}
        {ficha && tieneValor(ficha.descripcion) && (
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-pretty text-[15px] leading-relaxed text-zinc-300"
          >
            {ficha.descripcion}
          </motion.p>
        )}

        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-2">
          {moto.usos.map((uso) => (
            <span
              key={uso}
              className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-300"
            >
              {uso}
            </span>
          ))}
          <span
            className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] ${
              moto.aptaPrincipiante
                ? "border border-green-500/30 bg-green-500/10 text-green-400"
                : "border border-line text-muted"
            }`}
          >
            {moto.aptaPrincipiante ? "Apta primera moto" : "Requiere experiencia"}
          </span>
        </motion.div>
      </motion.section>

      {/* ── Destacados (solo con ficha) ─────────────────────────────────────── */}
      {ficha && ficha.destacados.length > 0 && (
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          aria-label="Destacados"
          className="border-t border-line"
        >
          <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
            <motion.p variants={fadeUp} className="label-mono mb-6 !text-[11px]">
              Destacados
            </motion.p>
            <motion.ul
              variants={staggerTight}
              className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2"
            >
              {ficha.destacados.map((d) => (
                <motion.li
                  key={d}
                  variants={fadeUp}
                  className="flex items-start gap-3 text-[15px] leading-snug text-zinc-200"
                >
                  <span className="mt-0.5 shrink-0 text-red-500">
                    <IconCheck />
                  </span>
                  {d}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.section>
      )}

      {/* ── Ficha técnica agrupada / fallback specs ─────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        aria-label="Especificaciones"
        className="border-t border-line"
      >
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          <motion.p variants={fadeUp} className="label-mono mb-6 !text-[11px]">
            {grupos.length > 0 ? "Ficha técnica" : "Especificaciones"}
          </motion.p>

          {grupos.length > 0 ? (
            // ── Ficha agrupada ──────────────────────────────────────────────
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >
              {grupos.map((g) => (
                <motion.div
                  key={g.titulo}
                  variants={fadeUp}
                  className="rounded-xl border border-line bg-surface-2 p-5"
                >
                  <div className="mb-4 flex items-center gap-2.5 text-red-500">
                    {g.icono}
                    <h3 className="label-mono !text-[11px] !text-white">{g.titulo}</h3>
                  </div>
                  <dl className="divide-y divide-line/70">
                    {g.filas.map(([etiqueta, valor]) => {
                      const noDisp = valor === "—";
                      return (
                        <div
                          key={etiqueta}
                          className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                        >
                          <dt className="shrink-0 font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
                            {etiqueta}
                          </dt>
                          <dd
                            className={`text-right text-[14px] font-medium ${
                              noDisp ? "text-muted/50" : "text-white"
                            }`}
                          >
                            {valor}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // ── Fallback: specs básicas originales ──────────────────────────
            <motion.dl
              variants={stagger}
              className="grid grid-cols-2 gap-5 sm:grid-cols-4"
            >
              <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
                <dt className="label-mono !text-[11px] mb-1">Cilindrada</dt>
                <dd className="font-display text-3xl font-extrabold text-white">
                  {moto.cc} <span className="text-xl text-muted">cc</span>
                </dd>
              </motion.div>

              <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
                <dt className="label-mono !text-[11px] mb-1">Segmento</dt>
                <dd className="font-display text-2xl font-extrabold text-white">
                  {moto.segmento}
                </dd>
              </motion.div>

              <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
                <dt className="label-mono !text-[11px] mb-1">Usos</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {moto.usos.map((uso) => (
                    <span
                      key={uso}
                      className="rounded-sm border border-line px-2 py-0.5 font-mono text-[11px] text-white"
                    >
                      {uso}
                    </span>
                  ))}
                </dd>
              </motion.div>

              <motion.div variants={fadeUp} className="rounded-xl border border-line bg-surface-2 p-5">
                <dt className="label-mono !text-[11px] mb-1">Primera moto</dt>
                <dd
                  className={`font-display text-2xl font-extrabold ${
                    moto.aptaPrincipiante ? "text-green-400" : "text-red-500"
                  }`}
                >
                  {moto.aptaPrincipiante ? "Sí" : "No"}
                </dd>
              </motion.div>
            </motion.dl>
          )}
        </div>
      </motion.section>

      {/* ── Colores (solo con ficha) ────────────────────────────────────────── */}
      {ficha && ficha.colores.length > 0 && (
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          aria-label="Colores disponibles"
          className="border-t border-line"
        >
          <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
            <motion.p variants={fadeUp} className="label-mono mb-6 !text-[11px]">
              Colores
            </motion.p>
            <motion.div variants={staggerTight} className="flex flex-wrap gap-3">
              {ficha.colores.map((color) => (
                <motion.span
                  key={color}
                  variants={fadeUp}
                  className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-2 py-1.5 pl-2 pr-4"
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/15"
                    style={{ backgroundColor: swatchHex(color) }}
                    aria-hidden
                  />
                  <span className="text-[13px] text-zinc-200">{color}</span>
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Precio + Simulador de financiamiento ──────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        aria-label="Precio y financiamiento"
        className="border-t border-line"
      >
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Columna izquierda: precio + CTA rápido */}
            <motion.div variants={fadeUp} className="flex flex-col justify-center">
              <p className="label-mono mb-4 !text-[11px]">Precio</p>
              <div className="flex flex-wrap items-baseline gap-4">
                {moto.precioBono !== null ? (
                  <>
                    <span className="text-xl text-muted line-through">
                      {formatCLP(moto.precioLista)}
                    </span>
                    <span className="font-display font-extrabold text-red-500" style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>
                      {formatCLP(moto.precioBono)}
                    </span>
                    <span className="rounded-sm bg-red-500 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white">
                      BONO
                    </span>
                  </>
                ) : (
                  <span className="font-display font-extrabold text-white" style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>
                    {formatCLP(moto.precioLista)}
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={linkWhatsApp(mensajeCotizacion(moto))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center rounded-md bg-red-500 px-8 font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                >
                  Cotizar por WhatsApp
                </a>
                <Link
                  href="/#catalogo"
                  className="inline-flex min-h-[48px] items-center rounded-md border border-line px-8 font-semibold text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
                >
                  ← Catálogo
                </Link>
              </div>
            </motion.div>

            {/* Columna derecha: simulador inline */}
            <motion.div variants={fadeUp}>
              <SimuladorInline
                precio={precioVigente(moto)}
                modeloNombre={moto.modelo}
                marcaNombre={moto.marca}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── Hermanos de la misma marca ──────────────────────────────────────── */}
      {hermanos.length > 0 && (
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          aria-label={`Más modelos ${moto.marca}`}
          className="border-t border-line"
        >
          <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
            <motion.p variants={fadeUp} className="label-mono mb-2 !text-[11px]">
              También de {moto.marca}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="headline-display mb-8 text-white"
              style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
            >
              Más modelos
            </motion.h2>
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {hermanos.map((hermano) => (
                <motion.div key={hermano.id} variants={fadeUp}>
                  <CardHermana moto={hermano} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}
    </main>
  );
}
