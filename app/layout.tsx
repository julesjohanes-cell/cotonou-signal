import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/components/AntdProvider";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

// Polices système : rien à télécharger (utile si le réseau de la salle est faible)
export const metadata: Metadata = {
  title: "Cotonou Signale",
  description: "Des signalements citoyens vérifiés, pour une ville plus propre.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e1065",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="mx-auto flex min-h-full w-full max-w-5xl flex-col font-sans">
        <AntdRegistry>
          <QueryProvider>
            <AntdProvider>{children}</AntdProvider>
          </QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
