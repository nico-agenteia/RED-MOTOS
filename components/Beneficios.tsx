"use client";

import { motion } from "framer-motion";

interface Beneficio {
  frase: React.ReactNode;
  apoyo: string;
  fondo: "bg-black" | "bg-surface";
}

const BENEFICIOS: Beneficio[] = [
  {
    frase: (
      <>
        Financiamiento en <span className="text-red-500">minutos</span>
      </>
    ),
    apoyo: "Trae tu carnet y sales manejando: el crédito se gestiona en tienda, al instante.",
    fondo: "bg-black",
  },
  {
    frase: (
      <>
        <span className="text-red-500">8</span> marcas oficiales
      </>
    ),
    apoyo: "Royal Enfield, Suzuki, Kymco, Benelli, Keeway, Haojue, Euromot y Zongshen en un solo lugar.",
    fondo: "bg-surface",
  },
  {
    frase: (
      <>
        Punto oficial{" "}
        <span className="inline-block rounded-sm bg-re-gold px-3 py-1 align-middle font-display text-[0.5em] font-bold uppercase tracking-wide text-re-dark">
          Royal Enfield
        </span>
      </>
    ),
    apoyo: "Distribuidor autorizado: garantía de fábrica, repuestos originales y servicio certificado.",
    fondo: "bg-black",
  },
  {
    frase: (
      <>
        Postventa en todo <span className="text-red-500">Chile</span>
      </>
    ),
    apoyo: "Compraste y te mudaste: la garantía y el servicio técnico te siguen donde estés.",
    fondo: "bg-surface",
  },
];

export default function Beneficios() {
  return (
    <section aria-label="Beneficios de comprar en Red Motos">
      {BENEFICIOS.map((b, i) => (
        <div
          key={i}
          className={`flex min-h-[60vh] items-center ${b.fondo}`}
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="headline-display text-white"
              style={{ fontSize: "clamp(48px, 7vw, 80px)" }}
            >
              {b.frase}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                delay: 0.12,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-4 max-w-xl text-base text-muted"
            >
              {b.apoyo}
            </motion.p>
          </div>
        </div>
      ))}
    </section>
  );
}
