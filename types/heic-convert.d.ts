// heic-convert no publica tipos. Declaración mínima para el uso que hacemos:
// convertir un Buffer HEIC/HEIF a JPEG/PNG en el servidor.
declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: Buffer | ArrayBuffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }
  function convert(options: HeicConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}
