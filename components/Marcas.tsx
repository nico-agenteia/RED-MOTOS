import { MARCAS_OFICIALES } from "@/lib/catalogo";

/**
 * Marquee de las 8 marcas oficiales. CSS puro (translateX infinite, 30s),
 * pausa en hover. Logos en blanco al 50% → 100% en hover. Royal Enfield y
 * Suzuki (insignias) van ligeramente más grandes.
 */
export default function Marcas() {
  // Duplicamos la fila para que el loop -50% sea continuo sin saltos.
  const fila = [...MARCAS_OFICIALES, ...MARCAS_OFICIALES];

  return (
    <section
      aria-label="Marcas distribuidas oficialmente"
      className="border-y border-line bg-surface py-12"
    >
      <p className="label-mono mb-8 text-center">Distribuidores oficiales</p>

      <div className="marquee-pausable overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-16 px-8">
          {fila.map((marca, i) => (
            <img
              key={`${marca.nombre}-${i}`}
              src={marca.logo}
              alt={`Logo ${marca.nombre}`}
              width={marca.insignia ? 140 : 110}
              height={48}
              loading="lazy"
              className={`w-auto object-contain opacity-50 transition-opacity duration-300 hover:opacity-100 ${
                marca.insignia ? "h-12" : "h-9"
              }`}
              style={{ filter: "brightness(0) invert(1)" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
