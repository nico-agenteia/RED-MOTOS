"use client";

import { motion } from "framer-motion";
import {
  NEGOCIO,
  SUCURSALES,
  HORARIO,
  linkWhatsApp,
  MENSAJE_WSP_GENERICO,
} from "@/lib/config";

function IconoPin() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E2231A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function IconoFacebook() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconoTikTok() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const LINKS_FOOTER = [
  { etiqueta: "Catálogo", href: "#catalogo" },
  { etiqueta: "Royal Enfield", href: "#royal-enfield" },
  { etiqueta: "Suzuki", href: "#suzuki" },
  { etiqueta: "Nosotros", href: "#nosotros" },
  { etiqueta: "Financiamiento", href: "#financiamiento" },
];

export default function Contacto() {
  const matriz = SUCURSALES.find((s) => s.esMatriz) ?? SUCURSALES[0];
  const mapaSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${matriz.direccion}, Santiago`,
  )}&output=embed`;

  return (
    <section
      id="contacto"
      aria-label="Contacto y sucursales"
      className="bg-surface pt-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="label-mono mb-3">Sucursales</p>
        <h2
          className="headline-display text-white"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Visítanos
        </h2>

        {/* Casa Matriz + mapa */}
        <div className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Tarjeta Casa Matriz */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col rounded-xl border border-line bg-surface-2 p-6 md:p-8"
          >
            <div className="flex items-start justify-between">
              <IconoPin />
              {matriz.esMatriz && (
                <span className="rounded-sm bg-red-500 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-white">
                  Casa Matriz
                </span>
              )}
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold uppercase text-white md:text-3xl">
              {matriz.nombre}
            </h3>
            <p className="mt-2 text-base text-muted">{matriz.direccion}</p>
            <p className="mt-1 text-sm text-muted/80">{HORARIO.completo}</p>
            <a
              href={matriz.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex min-h-[44px] items-center pt-6 text-sm font-semibold text-red-500 transition-colors duration-200 hover:text-red-600"
            >
              Cómo llegar →
            </a>
          </motion.article>

          {/* Mapa de la tienda */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-[320px] overflow-hidden rounded-xl border border-line bg-surface-2"
          >
            <iframe
              title={`Mapa de ${matriz.nombre} — ${matriz.direccion}`}
              src={mapaSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full min-h-[320px] w-full"
              style={{ border: 0, filter: "grayscale(0.2) contrast(1.05)" }}
            />
          </motion.div>
        </div>

        {/* CTA WhatsApp grande */}
        <div className="mt-10 flex justify-center">
          <motion.a
            href={linkWhatsApp(MENSAJE_WSP_GENERICO)}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex min-h-[56px] items-center gap-3 rounded-md bg-wsp px-8 text-base font-bold text-black transition-opacity duration-200 hover:opacity-90"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            {NEGOCIO.whatsapp} · Escríbenos ahora
          </motion.a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-line bg-black py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 md:flex-row md:justify-between md:px-8">
          <a
            href="#"
            aria-label={`${NEGOCIO.nombreLargo} — volver arriba`}
            className="flex items-center"
          >
            <img
              src="/logos/red-motos-logo.webp"
              alt={NEGOCIO.nombreLargo}
              className="h-16 w-auto"
            />
          </a>

          <nav aria-label="Enlaces rápidos" className="flex flex-wrap gap-6">
            {LINKS_FOOTER.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted transition-colors duration-200 hover:text-white"
              >
                {l.etiqueta}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3" aria-label="Redes sociales">
            <a
              href={NEGOCIO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram de ${NEGOCIO.nombreLargo}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted transition-colors duration-200 hover:border-white/30 hover:text-white"
            >
              <IconoInstagram />
            </a>
            <a
              href={NEGOCIO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Facebook de ${NEGOCIO.nombreLargo}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted transition-colors duration-200 hover:border-white/30 hover:text-white"
            >
              <IconoFacebook />
            </a>
            <a
              href={NEGOCIO.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`TikTok de ${NEGOCIO.nombreLargo}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted transition-colors duration-200 hover:border-white/30 hover:text-white"
            >
              <IconoTikTok />
            </a>
          </div>
        </div>
        <p className="label-mono mt-10 text-center !text-[10px]">
          © 2026 Red Motos Chile · Todos los derechos reservados
        </p>
      </footer>
    </section>
  );
}
