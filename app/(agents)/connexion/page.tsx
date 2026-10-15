"use client";
// Connexion agent (espace mairie, bonus). La session est un cookie httpOnly posé par /session.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Form, Input } from "antd";
import { Entete } from "@/components/ui";
import { ApiError, connexion, MOCKS } from "@/lib/api";
import { suiteSure } from "@/lib/securite";

function FormulaireConnexion() {
  const { message } = App.useApp();
  const router = useRouter();
  const suite = suiteSure(useSearchParams().get("suite"));
  const [chargement, setChargement] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-3 p-6">
      <h1 className="text-xl font-bold text-violet-950">Connexion agent</h1>
      <Form
        layout="vertical"
        onFinish={async (v: { identifiant: string; motDePasse?: string }) => {
          setChargement(true);
          try {
            await connexion(v.identifiant, v.motDePasse ?? "");
            router.replace(suite);
          } catch (err) {
            message.error(err instanceof ApiError ? err.message : "Connexion impossible");
            setChargement(false);
          }
        }}
      >
        <Form.Item
          label="Identifiant"
          name="identifiant"
          rules={[{ required: true, message: "Identifiant requis" }, { max: 150 }]}
          extra={MOCKS ? "Mode simulé : n'importe quel identifiant, « elu » pour la vue élu." : undefined}
        >
          <Input size="large" autoComplete="username" />
        </Form.Item>
        <Form.Item label="Mot de passe" name="motDePasse" rules={MOCKS ? [] : [{ required: true, message: "Mot de passe requis" }]}>
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={chargement}>
          Se connecter
        </Button>
      </Form>
    </main>
  );
}

export default function Connexion() {
  return (
    <>
      <Entete titre="Connexion" />
      <Suspense>
        <FormulaireConnexion />
      </Suspense>
    </>
  );
}
