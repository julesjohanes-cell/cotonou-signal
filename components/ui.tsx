// Petits composants partagés (mise en page, statut, catégorie).
// Utilisables côté serveur : pas d'antd ni d'icônes antd ici (elles exigent un composant client).
import Link from "next/link";
import type { Statut } from "@/lib/types";
import { categorie, STATUTS } from "@/lib/categories";
import { MOCKS } from "@/lib/api";

export function Entete({ titre, retour = "/" }: { titre?: string; retour?: string | null }) {
  return (
    <header className="fond-marque sticky top-0 z-10 flex min-h-14 items-center gap-2 px-2 pt-[env(safe-area-inset-top)]">
      {retour !== null && (
        <Link href={retour} className="flex h-11 w-11 items-center justify-center text-xl" aria-label="Retour">
          ←
        </Link>
      )}
      <Link href="/" className="flex h-11 items-center px-2 font-bold tracking-tight whitespace-nowrap">
        {/* span : dans un lien en flex, l'espace avant « Signale » disparaîtrait */}
        <span>
          Cotonou <span className="text-citron">Signale</span>
        </span>
      </Link>
      {titre && <span className="truncate text-sm text-sur-marque-doux">· {titre}</span>}
      {MOCKS && (
        <span className="mr-2 ml-auto rounded bg-citron px-2 py-0.5 text-[10px] font-bold text-sur-citron">MOCKS</span>
      )}
    </header>
  );
}

export function BadgeStatut({ statut }: { statut: Statut }) {
  const s = STATUTS[statut];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-sur-marque" style={{ background: s.couleur }}>
      {s.libelle}
    </span>
  );
}

/** `code` : slug renvoyé par l'API (category). */
export function LibelleCategorie({ code }: { code: string }) {
  const c = categorie(code);
  return (
    <span className="inline-flex items-center gap-1">
      <span>{c.icone}</span>
      <span>{c.libelle}</span>
    </span>
  );
}
