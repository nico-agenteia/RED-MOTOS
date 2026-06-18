// Composición del post de Instagram a partir del buffer de una imagen de moto.
// Las fuentes (Oswald) y los logos (Red Motos + marcas) van EMBEBIDOS en el
// bundle (lib/assets-marca.ts, base64) en vez de leerse de public/ con
// readFileSync. Así la plantilla funciona en cualquier entorno serverless
// (Vercel, Netlify, etc.) sin depender de outputFileTracing ni del filesystem.
// Para regenerar los assets embebidos: npx tsx _gen-assets.mts

import { renderPostInstagram } from "./post-instagram";
import {
  FONT_BOLD_B64,
  FONT_MEDIUM_B64,
  LOGO_PRINCIPAL_B64,
  MARCA_LOGOS_B64,
} from "./assets-marca";

/** base64 → ArrayBuffer (para las fuentes que Satori recibe como ArrayBuffer). */
function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const buf = Buffer.from(b64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * Compone el post de Instagram (1080×1080) sobre la moto recibida.
 * Devuelve un Buffer WebP listo para subir a Storage.
 * Lanza si algún paso crítico falla (el caller decide el fallback).
 */
export async function componerPostInstagram(imagenBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;

  // Moto cuadrada como fondo del post. Usamos "contain" (no "cover") para NO
  // recortar la moto: KIE suele devolver la imagen con el aspecto de la foto de
  // entrada (apaisada/vertical), y "cover" cortaba las ruedas. Las bandas que
  // quedan se rellenan en negro, justo donde el marco pone sus degradados
  // oscuros (arriba/abajo), así no se nota la unión.
  const motoPng = await sharp(imagenBuffer)
    .resize(1080, 1080, {
      fit: "contain",
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png()
    .toBuffer();
  const motoDataUri = `data:image/png;base64,${motoPng.toString("base64")}`;

  const logoDataUri = LOGO_PRINCIPAL_B64
    ? `data:image/png;base64,${LOGO_PRINCIPAL_B64}`
    : null;
  const marcaLogos = MARCA_LOGOS_B64.map((b64) => `data:image/png;base64,${b64}`);

  const svg = await renderPostInstagram({
    motoDataUri,
    logoDataUri,
    marcaLogos,
    fontBold: b64ToArrayBuffer(FONT_BOLD_B64),
    fontMedium: b64ToArrayBuffer(FONT_MEDIUM_B64),
  });

  return sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
}
