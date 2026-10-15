import type { NextConfig } from "next";

// Toutes les requêtes /api/* sont relayées vers Django.
// Résultat : une seule URL (HTTPS via le tunnel), pas de CORS à configurer.
// Les routes /api/v1/agent/* passent d'abord par proxy.ts (session obligatoire).
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const DEV = process.env.NODE_ENV !== "production";

// Domaines du fond de carte autorisés par la CSP. Changer NEXT_PUBLIC_MAP_STYLE pour une URL ? Son domaine est ajouté.
const TUILES = ["https://tiles.openfreemap.org", "https://tile.openstreetmap.org"];
try {
  const style = process.env.NEXT_PUBLIC_MAP_STYLE;
  if (style?.startsWith("https://")) TUILES.push(new URL(style).origin);
} catch {}

// Content-Security-Policy : seuls notre origine et le fond de carte peuvent charger du code, des images ou des données.
// 'unsafe-inline' reste nécessaire pour les scripts de Next et les styles d'Ant Design.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${TUILES.join(" ")}`,
  `connect-src 'self' ${TUILES.join(" ")}${DEV ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // CD de démo : le serveur en ligne tourne sur une copie du build (NEXT_DIST_DIR=.next-live, voir scripts/demo-continue.sh).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // CI uniquement : les types sont déjà vérifiés par tsc dans le job « Vérifications », en parallèle du build.
  // Partout ailleurs (poste de dev, machine de démo), le build les vérifie comme d'habitude.
  typescript: { ignoreBuildErrors: process.env.CI_TYPES_VERIFIES === "1" },
  poweredByHeader: false,
  // Le relais /api coupe à 30 s par défaut : trop court pour envoyer une photo sur un petit forfait
  experimental: { proxyTimeout: 120_000 },
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // Lien de capture WhatsApp à usage unique : jamais transmis à un autre site, jamais mis en cache ni indexé
        source: "/capture/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
      {
        source: "/mairie/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/media/:path*", destination: `${BACKEND_URL}/media/:path*` },
    ];
  },
  images: { unoptimized: true },
};

export default nextConfig;
