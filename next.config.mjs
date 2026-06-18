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
    // Garantiza que las fuentes y logos de public/ se incluyan en el bundle de
    // la función serverless de kie-status (Satori los lee con readFileSync; sin
    // esto, Vercel no los empaqueta y la plantilla de Instagram falla).
    outputFileTracingIncludes: {
      "/api/kie-status": ["./public/fonts/**", "./public/logos/**"],
      "/api/aplicar-plantilla": ["./public/fonts/**", "./public/logos/**"],
    },
  },
};

export default nextConfig;
