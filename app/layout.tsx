import type { Metadata, Viewport } from "next";
import QueryProvider from "@/components/QueryProvider";
import { COULEURS } from "@/lib/jetons";
import "./globals.css";

// Mobile d'abord : polices système (rien à télécharger), pas d'Ant Design ici (chargé seulement dans (agents)).
export const metadata: Metadata = {
  title: "Cotonou Signale",
  description: "Des signalements citoyens vérifiés, pour une ville plus propre.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // écrans à encoche : on gère les zones sûres avec env(safe-area-inset-*)
  themeColor: COULEURS.marque,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
