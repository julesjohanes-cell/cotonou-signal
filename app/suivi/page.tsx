"use client";
// ÉQUIPE PUBLIC — saisie du numéro de suivi
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Entete } from "@/components/ui";

export default function SaisieSuivi() {
  const [numero, setNumero] = useState("");
  const router = useRouter();
  return (
    <>
      <Entete titre="Suivi" />
      <main className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <h1 className="text-xl font-bold text-marque">Suivre mon signalement</h1>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (numero.trim()) router.push(`/suivi/${numero.trim().toUpperCase()}`);
          }}
        >
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="CS-7K3F9Q"
            maxLength={12}
            autoCapitalize="characters"
            aria-label="Numéro de suivi"
            className="flex-1 rounded-xl border border-contour bg-surface p-3 font-mono uppercase placeholder:text-encre-pale"
          />
          <button className="min-h-11 rounded-xl bg-violet px-5 font-semibold text-sur-marque">OK</button>
        </form>
      </main>
    </>
  );
}
