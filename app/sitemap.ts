import type { MetadataRoute } from "next";
import { NEGOCIO } from "@/lib/config";
import { CATALOGO } from "@/lib/catalogo";

// Sitemap dinámico: home + una entrada por ficha de modelo (/modelo/[slug]).
// Los slugs son los mismos ids del catálogo que alimentan generateStaticParams.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = NEGOCIO.web;
  const ahora = new Date();

  const fichas: MetadataRoute.Sitemap = CATALOGO.map((m) => ({
    url: `${base}/modelo/${m.id}`,
    lastModified: ahora,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: ahora, changeFrequency: "weekly", priority: 1 },
    ...fichas,
  ];
}
