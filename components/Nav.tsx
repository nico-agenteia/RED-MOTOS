"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { linkWhatsApp, MENSAJE_WSP_GENERICO, NEGOCIO } from "@/lib/config";
import MegaMenuMotos from "./MegaMenuMotos";

/* Desktop: "Catálogo" se reemplaza por el botón del megamenú "Motos". */
const LINKS = [
  { etiqueta: "Royal Enfield", href: "#royal-enfield" },
  { etiqueta: "Suzuki", href: "#suzuki" },
  { etiqueta: "Financiamiento", href: "#financiamiento" },
  { etiqueta: "Contacto", href: "#contacto" },
];

/* Mobile (drawer): conserva "Catálogo" — el megamenú es solo desktop. */
const LINKS_MOBILE = [{ etiqueta: "Catálogo", href: "#catalogo" }, ...LINKS];

export default function Nav() {
  const [conScroll, setConScroll] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [motosAbierto, setMotosAbierto] = useState(false);

  useEffect(() => {
    let raf = 0;
    const alScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setConScroll(window.scrollY > 80);
        /* Cerrar megamenú al hacer scroll */
        setMotosAbierto(false);
      });
    };
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Bloquear scroll del body con el drawer abierto.
  useEffect(() => {
    document.body.style.overflow = drawerAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerAbierto]);

  return (
    <header
      role="navigation"
      aria-label="Navegación principal"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-in-out-soft ${
        conScroll
          ? "bg-surface/80 backdrop-blur-xl border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 ease-in-out-soft md:px-8 ${
          conScroll ? "h-[56px]" : "h-[72px]"
        }`}
      >
        {/* Logo */}
        <a
          href="#"
          aria-label={`${NEGOCIO.nombreLargo} — inicio`}
          className="flex items-center"
        >
          <img
            src="/logos/red-motos-logo.png"
            alt={NEGOCIO.nombreLargo}
            className={`w-auto transition-all duration-300 ${
              conScroll ? "h-10" : "h-14"
            }`}
          />
        </a>

        {/* Links desktop */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Secciones">
          {/* Botón Motos — abre el megamenú */}
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={motosAbierto}
            onClick={() => setMotosAbierto((v) => !v)}
            className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-full after:origin-left after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 ${
              motosAbierto
                ? "text-white after:scale-x-100"
                : "text-muted after:scale-x-0"
            }`}
          >
            Motos
          </button>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-muted transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100"
            >
              {link.etiqueta}
            </a>
          ))}
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          <motion.a
            href={linkWhatsApp(MENSAJE_WSP_GENERICO)}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="hidden min-h-[44px] items-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 sm:inline-flex"
          >
            Cotizar → WhatsApp
          </motion.a>

          <a
            href="/admin"
            title="Panel Admin"
            className="hidden min-h-[44px] items-center gap-2 rounded-md border border-white/10 px-4 text-xs font-medium text-white/40 transition-colors duration-200 hover:border-white/20 hover:text-white/70 lg:inline-flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Panel Admin
          </a>

          <button
            type="button"
            aria-label={drawerAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={drawerAbierto}
            onClick={() => {
              setDrawerAbierto((v) => !v);
              setMotosAbierto(false);
            }}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-md lg:hidden"
          >
            <span
              className={`block h-[2px] w-6 bg-white transition-transform duration-300 ease-out-expo ${
                drawerAbierto ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-white transition-opacity duration-200 ${
                drawerAbierto ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-white transition-transform duration-300 ease-out-expo ${
                drawerAbierto ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Megamenú Motos (solo desktop) */}
      <MegaMenuMotos
        abierto={motosAbierto}
        onCerrar={() => setMotosAbierto(false)}
      />

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawerAbierto && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerAbierto(false)}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.nav
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              aria-label="Menú móvil"
              className="fixed right-0 top-0 z-50 flex h-dvh w-[280px] flex-col gap-2 overflow-y-auto border-l border-line bg-surface px-6 pb-10 pt-24 lg:hidden"
            >
              {LINKS_MOBILE.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => setDrawerAbierto(false)}
                  className="flex min-h-[44px] items-center font-display text-2xl font-bold uppercase text-white transition-colors duration-200 hover:text-red-500"
                >
                  {link.etiqueta}
                </motion.a>
              ))}
              <motion.a
                href={linkWhatsApp(MENSAJE_WSP_GENERICO)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  delay: LINKS_MOBILE.length * 0.08,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
              >
                Cotizar → WhatsApp
              </motion.a>

              <motion.a
                href="/admin"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  delay: (LINKS_MOBILE.length + 1) * 0.08,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => setDrawerAbierto(false)}
                className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-white/10 px-5 text-sm font-medium text-white/40 transition-colors duration-200 hover:border-white/20 hover:text-white/70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Panel Admin
              </motion.a>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
