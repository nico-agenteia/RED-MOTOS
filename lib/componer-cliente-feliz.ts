// Orquesta la composición de la imagen "Cliente feliz": normaliza la foto subida
// (auto-orientada por EXIF y recortada a 4:5 enfocando lo importante), renderiza
// el marco con Satori y devuelve un Buffer WebP listo para subir a Storage.
// Calcado de lib/componer-post.ts.

import { renderClienteFeliz } from "./cliente-feliz";
import {
  FONT_BOLD_B64,
  FONT_MEDIUM_B64,
  LOGO_PRINCIPAL_B64,
} from "./assets-marca";

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const buf = Buffer.from(b64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export interface DatosClienteFeliz {
  nombre?: string;
  moto?: string;
}

/**
 * Compone la pieza 1080×1350 sobre la foto del cliente. Devuelve un Buffer WebP.
 * Lanza si algún paso crítico falla (el caller decide el fallback).
 */
export async function componerClienteFeliz(
  fotoBuffer: Buffer,
  datos: DatosClienteFeliz = {},
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;

  // "cover" + position "attention" recorta a 4:5 priorizando la zona con más
  // detalle (normalmente las personas/la moto), en vez de cortar al centro fijo.
  const fotoPng = await sharp(fotoBuffer)
    .rotate()
    .resize(1080, 1350, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
  const fotoDataUri = `data:image/png;base64,${fotoPng.toString("base64")}`;

  const logoDataUri = LOGO_PRINCIPAL_B64
    ? `data:image/png;base64,${LOGO_PRINCIPAL_B64}`
    : null;

  const svg = await renderClienteFeliz({
    fotoDataUri,
    logoDataUri,
    fontBold: b64ToArrayBuffer(FONT_BOLD_B64),
    fontMedium: b64ToArrayBuffer(FONT_MEDIUM_B64),
    nombre: datos.nombre,
    moto: datos.moto,
  });

  return sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
}
