"use client";
// Thème Ant Design aux couleurs du design system (mêmes jetons que Tailwind : lib/jetons.ts). Utilisé surtout par l'espace mairie.
import { App, ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";
import { COULEURS, RAYONS } from "@/lib/jetons";

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: COULEURS.marque,
          colorLink: COULEURS.violet,
          colorText: COULEURS.encre,
          borderRadius: RAYONS.agents,
          fontFamily: "inherit",
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
