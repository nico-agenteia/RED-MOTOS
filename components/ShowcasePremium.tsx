"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefiereMenosMovimiento } from "@/lib/gsap-setup";
import { linkWhatsApp } from "@/lib/config";

type Spec = { valor: string; unidad: string; label: string };
type Modelo = {
  id: string;
  marca: string;
  nombre: string;
  familia: string;
  img: string;
  bg: string;
  acento: string;
  specs: Spec[];
  hermanos: string[];
  precioDesde: string;
};

// Showcase cinemático tipo Zero — una moto por pantalla, specs enormes.
const MODELOS_SHOWCASE: Modelo[] = [
  {
    id: "gsx-r1000r",
    marca: "Suzuki",
    nombre: "GSX-R1000R",
    familia: "RACING LINE",
    img: "/motos/GSX-R1000R.png",
    bg: "hsl(221, 60%, 6%)",
    acento: "#3B6FD4",
    specs: [
      { valor: "999", unidad: "CC", label: "CILINDRADA" },
      { valor: "202", unidad: "HP", label: "POTENCIA" },
      { valor: "299", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["GSX-S1000", "GSX-8S", "Hayabusa", "V-Strom 250"],
    precioDesde: "$ 13.999.900",
  },
  {
    id: "himalayan-452",
    marca: "Royal Enfield",
    nombre: "Himalayan 452",
    familia: "ADVENTURE LINE",
    img: "/motos/rally.png",
    bg: "hsl(36, 40%, 7%)",
    acento: "#D6A24A",
    specs: [
      { valor: "452", unidad: "CC", label: "CILINDRADA" },
      { valor: "40", unidad: "HP", label: "POTENCIA" },
      { valor: "160", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Scram 411", "Hunter 350", "Classic 350", "Meteor 350"],
    precioDesde: "$ 7.499.900",
  },
  {
    id: "super-meteor-650",
    marca: "Royal Enfield",
    nombre: "Super Meteor 650",
    familia: "CRUISER LINE",
    img: "/motos/CELESTIALRED.png",
    bg: "hsl(0, 35%, 7%)",
    acento: "#E2231A",
    specs: [
      { valor: "648", unidad: "CC", label: "CILINDRADA" },
      { valor: "47", unidad: "HP", label: "POTENCIA" },
      { valor: "180", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Classic 650", "Shotgun 650", "Bear 650"],
    precioDesde: "$ 9.999.900",
  },
  {
    id: "hunter-350",
    marca: "Royal Enfield",
    nombre: "Hunter 350",
    familia: "STREET LINE",
    img: "/motos/Hunter350.png",
    bg: "hsl(36, 25%, 8%)",
    acento: "#D6A24A",
    specs: [
      { valor: "349", unidad: "CC", label: "CILINDRADA" },
      { valor: "20", unidad: "HP", label: "POTENCIA" },
      { valor: "114", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Classic 350", "Meteor 350", "Scram 411"],
    precioDesde: "$ 4.699.900",
  },
  {
    id: "vstrom-250",
    marca: "Suzuki",
    nombre: "V-Strom 250",
    familia: "ADVENTURE LINE",
    img: "/motos/VSTROM250.png",
    bg: "hsl(221, 40%, 7%)",
    acento: "#3B6FD4",
    specs: [
      { valor: "248", unidad: "CC", label: "CILINDRADA" },
      { valor: "26", unidad: "HP", label: "POTENCIA" },
      { valor: "145", unidad: "KM/H", label: "VELOCIDAD" },
    ],
    hermanos: ["Gixxer 150", "Gixxer 250", "GSX-8S"],
    precioDesde: "$ 4.799.900",
  },
];

const MENSAJE_HERMANOS = (m: Modelo) =>
  `Hola! Vi la ${m.marca} ${m.nombre} en la web de Red Motos y quiero más info. ¿Me cotizan?`;

function ModeloSection({ modelo, index }: { modelo: Modelo; index: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const nombreRef = useRef<HTMLHeadingElement>(null);
  const hermanosRef = useRef<HTMLUListElement>(null);
  const lineaRef = useRef<HTMLSpanElement>(null);
  const valoresRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const seccion = sectionRef.current;
    if (!seccion) return;

    // Accesibilidad: sin animación, todo visible de inmediato.
    if (prefiereMenosMovimiento()) {
      valoresRef.current.forEach((el, i) => {
        if (el) el.textContent = modelo.specs[i].valor;
      });
      return;
    }

    const ctx = gsap.context(() => {
      const elementos = [
        imgRef.current,
        nombreRef.current,
        hermanosRef.current,
        lineaRef.current,
      ].filter(Boolean) as Element[];
      gsap.set(elementos, { autoAlpha: 0 });

      ScrollTrigger.create({
        trigger: seccion,
        start: "top 55%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to(imgRef.current, {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
            ease: "expo.out",
            startAt: { x: -80 },
          })
            .to(
              nombreRef.current,
              { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out", startAt: { y: 24 } },
              "-=0.45",
            )
            .to(
              hermanosRef.current,
              { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out", startAt: { y: -16 } },
              "-=0.3",
            )
            .to(
              lineaRef.current,
              {
                autoAlpha: 1,
                scaleX: 1,
                duration: 0.6,
                ease: "power3.out",
                transformOrigin: "left",
                startAt: { scaleX: 0 },
              },
              "-=0.4",
            );

          // Count-up de cada spec.
          modelo.specs.forEach((spec, i) => {
            const destino = parseFloat(spec.valor);
            const contador = { val: 0 };
            gsap.to(contador, {
              val: destino,
              duration: 1.2,
              ease: "power2.out",
              delay: 0.3 + i * 0.1,
              onUpdate: () => {
                const el = valoresRef.current[i];
                if (el) el.textContent = Math.round(contador.val).toString();
              },
            });
          });
        },
      });
    }, seccion);

    return () => ctx.revert();
  }, [modelo]);

  return (
    <section
      ref={sectionRef}
      aria-label={`${modelo.marca} ${modelo.nombre}`}
      className="sticky top-0 min-h-dvh overflow-hidden"
      style={{ backgroundColor: modelo.bg, zIndex: index + 1 }}
    >
      {/* Barra lateral: línea + familia rotada (desktop) */}
      <div
        aria-hidden="true"
        className="absolute left-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 lg:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="h-24 w-px bg-white/20" />
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          {modelo.familia}
        </span>
      </div>

      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col items-center gap-8 px-6 py-24 md:grid md:grid-cols-2 md:items-center md:gap-4 md:px-12">
        {/* Moto */}
        <div className="order-1 flex w-full items-center justify-center md:justify-start">
          <img
            ref={imgRef}
            src={modelo.img}
            alt={`${modelo.marca} ${modelo.nombre}`}
            width={640}
            height={427}
            loading={index === 0 ? "eager" : "lazy"}
            className="w-full max-w-[420px] object-contain md:max-w-[560px]"
            style={{ filter: `drop-shadow(0 30px 70px ${modelo.acento}44) drop-shadow(0 8px 24px rgba(0,0,0,0.6))` }}
          />
        </div>

        {/* Texto */}
        <div className="order-2 flex w-full flex-col md:items-end md:text-right">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: modelo.acento }}
          >
            {modelo.marca}
          </span>

          <h2
            ref={nombreRef}
            className="headline-display mt-3 leading-[0.85] text-white"
            style={{ fontSize: "clamp(56px, 9vw, 132px)" }}
          >
            {modelo.nombre}
          </h2>

          {/* Hermanos */}
          <ul
            ref={hermanosRef}
            aria-label="Otros modelos de la familia"
            className="mt-5 flex flex-col gap-1 md:items-end"
          >
            {modelo.hermanos.map((h, i) => (
              <li
                key={h}
                className="headline-display text-white/20 transition-opacity duration-200 hover:text-white/45"
                style={{ fontSize: `${Math.max(20, 52 - i * 10)}px`, lineHeight: 1.05 }}
              >
                {h}
              </li>
            ))}
          </ul>

          {/* Specs */}
          <div className="mt-10 w-full">
            <span
              ref={lineaRef}
              aria-hidden="true"
              className="mb-5 block h-px w-full"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            />
            <dl className="grid grid-cols-3 gap-4 md:gap-6">
              {modelo.specs.map((spec, i) => (
                <div key={spec.label} className="flex flex-col md:items-end">
                  <dd
                    className="font-display font-extrabold leading-none"
                    style={{ fontSize: "clamp(40px, 5.5vw, 80px)", color: modelo.acento }}
                  >
                    <span ref={(el) => { valoresRef.current[i] = el; }}>{spec.valor}</span>
                    <span
                      className="ml-1 font-mono text-[clamp(12px,1.4vw,18px)] font-medium uppercase tracking-wider"
                      style={{ color: modelo.acento }}
                    >
                      {spec.unidad}
                    </span>
                  </dd>
                  <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
                    {spec.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Precio + CTA */}
          <div className="mt-9 flex w-full flex-col gap-3 md:items-end">
            <p className="text-sm text-white/50">
              Desde <span className="font-medium text-white/80">{modelo.precioDesde}</span>{" "}
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/35">
                [referencial]
              </span>
            </p>
            <a
              href={linkWhatsApp(MENSAJE_HERMANOS(modelo))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md px-8 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
              style={{ backgroundColor: modelo.acento }}
            >
              Cotizar {modelo.nombre}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ShowcasePremium() {
  return (
    <section aria-label="Modelos destacados" className="relative bg-black">
      {MODELOS_SHOWCASE.map((modelo, i) => (
        <ModeloSection key={modelo.id} modelo={modelo} index={i} />
      ))}
    </section>
  );
}
