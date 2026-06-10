"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { linkWhatsApp, MENSAJE_WSP_GENERICO, NEGOCIO } from "@/lib/config";

export default function WhatsAppFloat() {
  const [oculto, setOculto] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Se oculta mientras el RecomendadorIA está abierto.
  useEffect(() => {
    const alCambiar = (e: Event) => {
      const detalle = (e as CustomEvent<{ abierto: boolean }>).detail;
      setOculto(detalle.abierto);
    };
    window.addEventListener("rm:recomendador-estado", alCambiar);
    return () =>
      window.removeEventListener("rm:recomendador-estado", alCambiar);
  }, []);

  return (
    <AnimatePresence>
      {!oculto && (
        <motion.div
          key="wsp-float"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-6 right-6 z-50"
        >
          {/* Tooltip */}
          <AnimatePresence>
            {tooltipVisible && (
              <motion.span
                key="wsp-tooltip"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                role="tooltip"
                className="absolute right-[64px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-white"
              >
                {NEGOCIO.whatsapp}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.a
            href={linkWhatsApp(MENSAJE_WSP_GENERICO)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribir a Red Motos por WhatsApp: ${NEGOCIO.whatsapp}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-wsp shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          >
            {/* Pulse ring */}
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-pulseRing rounded-full bg-wsp/50"
            />
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="#0A0A0A"
              aria-hidden="true"
              className="relative"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
