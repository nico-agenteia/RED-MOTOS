// Binarios nativos de sharp (libvips) para linux-x64. El file-tracing de Next
// externaliza sharp pero NO arrastra su .so a la función serverless, así sharp
// no carga en Vercel (ERR_DLOPEN_FAILED: libvips-cpp.so... cannot open shared
// object file). Forzamos su inclusión en cada ruta que usa sharp. La build de
// Vercel corre en linux, por eso estos globs resuelven allí.
const SHARP_NATIVO = [
  "./node_modules/@img/sharp-linux-x64/**",
  "./node_modules/@img/sharp-libvips-linux-x64/**",
];

// heic-convert decodifica HEIC vía libheif, que lee un .wasm externo en runtime.
// Igual que con el .so de sharp, el file-tracing de Next puede no incluirlo, así
// que forzamos sus archivos en la función que convierte las subidas (HEIC iPhone).
const HEIC_DEPS = [
  "./node_modules/libheif-js/**",
  "./node_modules/heic-convert/**",
  "./node_modules/heic-decode/**",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // sharp es un módulo nativo: hay que externalizarlo para que las funciones
  // serverless (rutas de /api) lo carguen desde node_modules y no intente
  // empaquetarlo webpack (causa crash al iniciar la función en Vercel).
  experimental: {
    serverComponentsExternalPackages: ["sharp", "heic-convert"],
    outputFileTracingIncludes: {
      "/api/kie-status": SHARP_NATIVO,
      "/api/aplicar-plantilla": SHARP_NATIVO,
      "/api/procesar-imagen": [...SHARP_NATIVO, ...HEIC_DEPS],
      "/api/storage/catalogo": SHARP_NATIVO,
    },
  },
};

export default nextConfig;
