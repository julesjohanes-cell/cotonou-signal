// Petits composants partagés (mise en page, statut, catégorie).
// Utilisables côté serveur : pas d'antd ni d'icônes antd ici (elles exigent un composant client).
import Link from "next/link";
import type { CategorieCode, Statut } from "@/lib/types";
import { categorie, STATUTS } from "@/lib/categories";
import { MOCKS } from "@/lib/api";

export function Entete({ titre, retour = "/" }: { titre?: string; retour?: string | null }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-violet-950 px-4 py-3 text-white">
      {retour !== null && (
        <Link href={retour} className="text-xl" aria-label="Retour">
          ←
        </Link>
      )}
      <Link href="/" className="font-bold tracking-tight">
        Cotonou <span className="text-lime-400">Signale</span>
      </Link>
      {titre && <span className="truncate text-sm text-violet-200">· {titre}</span>}
      {MOCKS && (
        <span className="ml-auto rounded bg-lime-400 px-2 py-0.5 text-[10px] font-bold text-violet-950">MOCKS</span>
      )}
    </header>
  );
}

export function BadgeStatut({ statut }: { statut: Statut }) {
  const s = STATUTS[statut];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: s.couleur }}>
      {s.libelle}
    </span>
  );
}

export function LibelleCategorie({ code }: { code: CategorieCode }) {
  const c = categorie(code);
  return (
    <span className="inline-flex items-center gap-1">
      <span>{c.icone}</span>
      <span>{c.libelle}</span>
    </span>
  );
}
