"use client";
// ÉQUIPE CAPTURE — page ouverte depuis le lien unique WhatsApp (valable 10 min)
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Entete } from "@/components/ui";
import SignalementFlow from "@/components/signalement/SignalementFlow";
import { verifierLien, messageRefus } from "@/lib/api";
import type { LienWhatsApp } from "@/lib/types";

export default function CaptureWhatsApp() {
  const { token } = useParams<{ token: string }>();
  const [lien, setLien] = useState<LienWhatsApp | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    verifierLien(token).then(setLien).catch(() => setErreur(messageRefus("reseau")));
  }, [token]);

  return (
    <>
      <Entete titre="Signalement WhatsApp" retour={null} />
      <main className="flex-1">
        {erreur && <p className="m-4 rounded-xl bg-red-50 p-4 text-red-800">{erreur}</p>}
        {!lien && !erreur && <p className="p-6 text-center text-gray-500">Vérification du lien…</p>}
        {lien && !lien.valide && (
          <div className="m-4 rounded-xl bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Lien invalide</p>
            <p className="text-sm">{messageRefus(lien.raison === "utilise" ? "lien_utilise" : "lien_expire")}</p>
          </div>
        )}
        {lien?.valide && <SignalementFlow token={token} />}
      </main>
    </>
  );
}
