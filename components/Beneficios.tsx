"use client";

import { useReveal } from "@/lib/useReveal";

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
        <span className="text-red-500">5</span> marcas oficiales
      </>
    ),
    apoyo: "Royal Enfield, Suzuki, Kymco, Zonsen y Cyclone en un solo lugar.",
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

/** Un bloque de beneficio con reveal GSAP (expo.out) y trigger propio. */
function BeneficioBloque({ b }: { b: Beneficio }) {
  const ref = useReveal<HTMLDivElement>(".beneficio-reveal", {
    y: 56,
    stagger: 0.12,
    start: "top 78%",
    duration: 1,
  });

  return (
    <div className={`flex min-h-[60vh] items-center ${b.fondo}`}>
      <div ref={ref} className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <h2
          className="beneficio-reveal headline-display text-white"
          style={{ fontSize: "clamp(48px, 7vw, 80px)" }}
        >
          {b.frase}
        </h2>
        <p className="beneficio-reveal mt-4 max-w-xl text-base text-muted">
          {b.apoyo}
        </p>
      </div>
    </div>
  );
}

export default function Beneficios() {
  return (
    <section aria-label="Beneficios de comprar en Red Motos">
      {BENEFICIOS.map((b, i) => (
        <BeneficioBloque key={i} b={b} />
      ))}
    </section>
  );
}
