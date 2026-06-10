import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { NEGOCIO, SUCURSALES } from "@/lib/config";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(NEGOCIO.web),
  title:
    "Red Motos Chile | Concesionario Oficial Royal Enfield y Suzuki en Santiago",
  description:
    `Venta de motos nuevas en Santiago. Punto oficial Royal Enfield y Suzuki. ` +
    `8 marcas, financiamiento en el acto. Visítanos en ${SUCURSALES[0].direccion}.`,
  keywords: [
    "motos Santiago",
    "Royal Enfield Chile",
    "Suzuki motos",
    "concesionaria motos",
    "Red Motos",
    "financiamiento motos",
  ],
  openGraph: {
    title: "Red Motos Chile | Punto Oficial Royal Enfield y Suzuki",
    description:
      "Concesionario multimarca en Santiago. 8 marcas oficiales, financiamiento en minutos y postventa en todo Chile.",
    url: NEGOCIO.web,
    siteName: NEGOCIO.nombreLargo,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Red Motos Chile | Punto Oficial Royal Enfield y Suzuki",
    description:
      "Concesionario multimarca en Santiago. 8 marcas oficiales y financiamiento en minutos.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-CL"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
