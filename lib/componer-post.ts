// Composición del post de Instagram a partir del buffer de una imagen de moto.
// Centraliza la lectura de assets (fuentes + logos desde public/ vía filesystem)
// y la llamada a Satori, para que tanto kie-status (flujo automático) como
// /api/aplicar-plantilla (re-aplicar sin gastar KIE) usen la misma lógica.

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { renderPostInstagram } from "./post-instagram";

const ARCHIVOS_MARCA = [
  "logo-royal-enfield",
  "logo-suzuki",
  "logo-kymco",
  "logo-cyclone",
  "logo-zonsen",
];

/**
 * Compone el post de Instagram (1080×1080) sobre la moto recibida.
 * Devuelve un Buffer WebP listo para subir a Storage.
 * Lanza si algún paso crítico falla (el caller decide el fallback).
 */
export async function componerPostInstagram(imagenBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const publicDir = join(process.cwd(), "public");

  const fileToPngDataUri = async (filePath: string): Promise<string | null> => {
    if (!existsSync(filePath)) return null;
    const buf = readFileSync(filePath);
    const png = await sharp(buf).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  };

  // Moto cuadrada como fondo del post.
  const motoPng = await sharp(imagenBuffer)
    .resize(1080, 1080, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const motoDataUri = `data:image/png;base64,${motoPng.toString("base64")}`;

  const logoDataUri = await fileToPngDataUri(
    join(publicDir, "logos", "red-motos-logo.webp"),
  );

  const marcaLogos: string[] = [];
  for (const f of ARCHIVOS_MARCA) {
    const uri = await fileToPngDataUri(join(publicDir, "logos", `${f}.webp`));
    if (uri) marcaLogos.push(uri);
  }

  const fontBoldBuf = readFileSync(join(publicDir, "fonts", "Oswald-700.ttf"));
  const fontMediumBuf = readFileSync(join(publicDir, "fonts", "Oswald-500.ttf"));
  const fontBold = fontBoldBuf.buffer.slice(
    fontBoldBuf.byteOffset,
    fontBoldBuf.byteOffset + fontBoldBuf.byteLength,
  );
  const fontMedium = fontMediumBuf.buffer.slice(
    fontMediumBuf.byteOffset,
    fontMediumBuf.byteOffset + fontMediumBuf.byteLength,
  );

  const svg = await renderPostInstagram({
    motoDataUri,
    logoDataUri,
    marcaLogos,
    fontBold,
    fontMedium,
  });

  return sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
}
