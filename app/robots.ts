import type { MetadataRoute } from "next";
import { NEGOCIO } from "@/lib/config";

// robots.txt: indexar el sitio público, bloquear el panel admin y la API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${NEGOCIO.web}/sitemap.xml`,
    host: NEGOCIO.web,
  };
}
