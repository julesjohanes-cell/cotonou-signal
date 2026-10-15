"use client";
// ÉQUIPE WHATSAPP + SUIVI — page ouverte depuis le lien unique WhatsApp (valable 10 min).
// Le back envoie <FRONT_URL>/capture/<token> ; GET /capture-sessions/{token} dit si le lien est encore utilisable.
import { useParams } from "next/navigation";
import { Entete } from "@/components/ui";
import SignalementFlow from "@/components/signalement/SignalementFlow";
import { useLienCapture } from "@/hooks/useSignalements";
import { ApiError } from "@/lib/api";

// Lien inconnu (404), déjà utilisé (409) ou expiré (410) : il faut en redemander un sur WhatsApp
const LIEN_INVALIDE = ["NOT_FOUND", "TOKEN_USED", "TOKEN_EXPIRED"];

export default function CaptureWhatsApp() {
  const { token } = useParams<{ token: string }>();
  const { data: lien, isPending, error } = useLienCapture(token);
  const invalide = error instanceof ApiError && LIEN_INVALIDE.includes(error.code);

  return (
    <>
      <Entete titre="Signalement WhatsApp" retour={null} />
      <main className="flex-1">
        {isPending && <p className="p-6 text-center text-encre-pale">Vérification du lien…</p>}
        {(invalide || lien?.valid === false) && (
          <div className="m-4 rounded-xl bg-erreur-fond p-4 text-erreur">
            <p className="font-semibold">Lien invalide</p>
            <p className="text-sm">{error?.message ?? "Ce lien de signalement ne peut plus servir."}</p>
            <p className="text-sm">Écris « Signaler » à nouveau sur WhatsApp pour recevoir un nouveau lien.</p>
          </div>
        )}
        {error && !invalide && <p className="m-4 rounded-xl bg-erreur-fond p-4 text-erreur">{error.message}</p>}
        {lien?.valid && <SignalementFlow token={token} />}
      </main>
    </>
  );
}
