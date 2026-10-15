"use client";
// Thème Ant Design aux couleurs du brief (même jetons que Tailwind). Utilisé surtout par l'espace mairie.
import { App, ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";

export const COULEURS = {
  violetNuit: "#3A0C6F",
  violet: "#481689",
  citron: "#BAE206",
  encre: "#1B1327",
  fond: "#F9F8FB",
};

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: COULEURS.violetNuit,
          colorLink: COULEURS.violet,
          colorText: COULEURS.encre,
          borderRadius: 10,
          fontFamily: "inherit",
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
