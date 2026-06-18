// Genera lib/assets-marca.ts con las fuentes (Oswald 500/700) y los logos
// (Red Motos + marcas oficiales) embebidos como base64. Así la composición del
// post de Instagram NO depende del filesystem en runtime serverless: webpack
// empaqueta los assets dentro de la función. Los logos se pre-convierten a PNG
// porque Satori no decodifica WebP de forma fiable.
//
// Ejecutar desde la raíz del proyecto web: npx tsx scripts/gen-assets-marca.mts
// Regenerar SIEMPRE que cambien las fuentes o los logos de marca.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const publicDir = join(process.cwd(), "public");

// Orden oficial pactado de las 5 marcas que muestra el marco de Instagram.
const ARCHIVOS_MARCA = [
  "logo-royal-enfield",
  "logo-suzuki",
  "logo-kymco",
  "logo-cyclone",
  "logo-zonsen",
];

async function logoWebpToPngB64(file: string): Promise<string | null> {
  const p = join(publicDir, "logos", `${file}.webp`);
  if (!existsSync(p)) {
    console.warn("FALTA:", p);
    return null;
  }
  const png = await sharp(readFileSync(p)).png().toBuffer();
  return png.toString("base64");
}

const fontBold = readFileSync(join(publicDir, "fonts", "Oswald-700.ttf")).toString("base64");
const fontMedium = readFileSync(join(publicDir, "fonts", "Oswald-500.ttf")).toString("base64");
const logoMain = await logoWebpToPngB64("red-motos-logo");

const marcas: Record<string, string> = {};
for (const f of ARCHIVOS_MARCA) {
  const b64 = await logoWebpToPngB64(f);
  if (b64) marcas[f] = b64;
}

const out = `// ARCHIVO GENERADO por scripts/gen-assets-marca.mts — NO editar a mano.
// Fuentes (Oswald 500/700) y logos de marca embebidos como base64 para que la
// plantilla de Instagram funcione en cualquier entorno serverless sin leer del
// filesystem. Regenerar: npx tsx scripts/gen-assets-marca.mts

/** Oswald 700 (.ttf) en base64. */
export const FONT_BOLD_B64 = ${JSON.stringify(fontBold)};
/** Oswald 500 (.ttf) en base64. */
export const FONT_MEDIUM_B64 = ${JSON.stringify(fontMedium)};
/** Logo Red Motos (PNG) en base64, o null si no estaba disponible al generar. */
export const LOGO_PRINCIPAL_B64: string | null = ${logoMain ? JSON.stringify(logoMain) : "null"};
/** Logos de marca (PNG) en base64, en el orden oficial pactado. */
export const MARCA_LOGOS_B64: string[] = ${JSON.stringify(ARCHIVOS_MARCA.map((f) => marcas[f]).filter(Boolean))};
`;

writeFileSync(join(process.cwd(), "lib", "assets-marca.ts"), out, "utf8");
console.log(
  "OK lib/assets-marca.ts — fuentes:2, logo principal:",
  logoMain ? "sí" : "NO",
  "marcas:",
  Object.keys(marcas).length,
);
