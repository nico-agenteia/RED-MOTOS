import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATALOGO, precioVigente } from "@/lib/catalogo";
import { formatCLP } from "@/lib/utils";
import { NEGOCIO } from "@/lib/config";
import Nav from "@/components/Nav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ModeloDetalle from "@/components/ModeloDetalle";

// ─── Rutas estáticas — una por cada modelo del catálogo ──────────────────────
export function generateStaticParams() {
  return CATALOGO.map((m) => ({ slug: m.id }));
}

// ─── Metadata dinámica ────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const moto = CATALOGO.find((m) => m.id === params.slug);

  if (!moto) {
    return {
      title: `Modelo no encontrado | ${NEGOCIO.nombreLargo}`,
    };
  }

  const precio = formatCLP(precioVigente(moto));
  const description =
    `${moto.marca} ${moto.modelo} — ${moto.segmento} de ${moto.cc} cc. ` +
    `Precio: ${precio}. Disponible en Red Motos Chile, concesionario oficial en Santiago.`;

  return {
    title: `${moto.marca} ${moto.modelo} | ${NEGOCIO.nombreLargo}`,
    description,
    openGraph: {
      title: `${moto.marca} ${moto.modelo} | ${NEGOCIO.nombreLargo}`,
      description,
      images: [{ url: moto.img, width: 800, height: 600, alt: `${moto.marca} ${moto.modelo}` }],
      url: `${NEGOCIO.web}/modelo/${moto.id}`,
      siteName: NEGOCIO.nombreLargo,
      locale: "es_CL",
      type: "website",
    },
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ModeloPage({
  params,
}: {
  params: { slug: string };
}) {
  const moto = CATALOGO.find((m) => m.id === params.slug);

  if (!moto) {
    notFound();
  }

  return (
    <>
      <Nav />
      <ModeloDetalle moto={moto} />
      <WhatsAppFloat />
    </>
  );
}
