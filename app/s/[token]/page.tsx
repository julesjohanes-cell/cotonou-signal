"use client";
// ÉQUIPE WHATSAPP + SUIVI — page ouverte depuis le lien unique WhatsApp (valable 10 min)
import { useParams } from "next/navigation";
import { Entete } from "@/components/ui";
import SignalementFlow from "@/components/signalement/SignalementFlow";
import { useLienWhatsApp } from "@/hooks/useSignalements";
import { messageRefus } from "@/lib/api";

export default function CaptureWhatsApp() {
  const { token } = useParams<{ token: string }>();
  const { data: lien, isPending, isError } = useLienWhatsApp(token);

  return (
    <>
      <Entete titre="Signalement WhatsApp" retour={null} />
      <main className="flex-1">
        {isError && <p className="m-4 rounded-xl bg-red-50 p-4 text-red-800">{messageRefus("reseau")}</p>}
        {isPending && <p className="p-6 text-center text-gray-500">Vérification du lien…</p>}
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
