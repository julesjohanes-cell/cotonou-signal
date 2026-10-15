import type { NextConfig } from "next";

// Toutes les requêtes /api/* sont relayées vers Django.
// Résultat : une seule URL (HTTPS via le tunnel), pas de CORS à configurer.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Autorise le serveur de dev derrière un tunnel HTTPS (caméra + GPS sur téléphone)
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.loca.lt",
  ],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/media/:path*", destination: `${BACKEND_URL}/media/:path*` },
    ];
  },
  images: { unoptimized: true },
};

export default nextConfig;
