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
  },
};

export default nextConfig;
