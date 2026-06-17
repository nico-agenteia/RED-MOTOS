"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Props {
  /** URL del iFrame de Araña ya prellenada; null = modal cerrado. */
  src: string | null;
  onClose: () => void;
}

/**
 * Modal que embebe el iFrame de solicitud de Autofin (Araña — Opción A).
 * Autofin maneja el formulario del cliente (RUT, renta, etc.): esos datos
 * sensibles NO pasan por nosotros. Lo presentamos dentro de nuestro contenedor
 * con encabezado/cierre y ancho acotado para que su diseño no choque con el sitio.
 */
export default function ModalSolicitud({ src, onClose }: Props) {
  const reducir = useReducedMotion();
  const abierto = src !== null;

  // ESC para cerrar + bloqueo del scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", alTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onClose]);

  const animPanel = reducir
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 40, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 40, scale: 0.98 },
      };

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6">
          <motion.div
            key="scrim-solicitud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key="panel-solicitud"
            role="dialog"
            aria-modal="true"
            aria-label="Solicitud de financiamiento"
            {...animPanel}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="relative z-10 flex h-[100dvh] w-full flex-col border border-line bg-surface shadow-[0_24px_64px_rgba(0,0,0,0.6)] sm:h-[88vh] sm:max-w-2xl sm:rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Solicita tu financiamiento
                </p>
                <p className="label-mono !text-[10px]">
                  Proceso seguro con Autofin
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar solicitud"
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

            {src && (
              <iframe
                src={src}
                title="Solicitud de financiamiento Autofin"
                className="min-h-0 w-full flex-1 border-0 bg-white"
                allow="clipboard-write"
              />
            )}

            <p className="border-t border-line px-5 py-3 text-center text-[10px] leading-relaxed text-muted">
              Tus datos personales los gestiona Autofin de forma segura. Red Motos
              no almacena tu RUT ni tu información financiera en este paso.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
