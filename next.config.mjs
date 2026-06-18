// Binarios nativos de sharp (libvips) para linux-x64. El file-tracing de Next
// externaliza sharp pero NO arrastra su .so a la función serverless, así sharp
// no carga en Vercel (ERR_DLOPEN_FAILED: libvips-cpp.so... cannot open shared
// object file). Forzamos su inclusión en cada ruta que usa sharp. La build de
// Vercel corre en linux, por eso estos globs resuelven allí.
const SHARP_NATIVO = [
  "./node_modules/@img/sharp-linux-x64/**",
  "./node_modules/@img/sharp-libvips-linux-x64/**",
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
    serverComponentsExternalPackages: ["sharp"],
    outputFileTracingIncludes: {
      "/api/kie-status": SHARP_NATIVO,
      "/api/aplicar-plantilla": SHARP_NATIVO,
      "/api/procesar-imagen": SHARP_NATIVO,
      "/api/storage/catalogo": SHARP_NATIVO,
    },
  },
};

export default nextConfig;
