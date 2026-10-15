"use client";
// ÉQUIPE CARTE — carte de Cotonou (points du problème uniquement, jamais la position du citoyen)
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeStatut, Entete, LibelleCategorie } from "@/components/ui";
import { MapView, type Marqueur } from "@/components/carte";
import { useSignalementsCarte } from "@/hooks/useSignalements";
import { CATEGORIES, ORDRE_STATUTS, STATUTS, categorie, type CategorieCode } from "@/lib/categories";
import { depuis } from "@/lib/dates";

export default function Carte() {
  const { data, isPending, isError, refetch } = useSignalementsCarte();
  const [filtre, setFiltre] = useState<CategorieCode | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  const liste = useMemo(() => data ?? [], [data]);
  const visibles = useMemo(() => liste.filter((s) => !filtre || s.category === filtre), [liste, filtre]);
  const marqueurs: Marqueur[] = useMemo(
    () =>
      visibles.map((s) => ({
        id: s.tracking_code,
        lat: s.lat,
        lng: s.lng,
        couleur: STATUTS[s.status].couleur,
        contenu: categorie(s.category).icone,
        titre: categorie(s.category).libelle,
        badge: s.support_count,
      })),
    [visibles],
  );
  const choisi = liste.find((s) => s.tracking_code === selection);
  const resolus = liste.filter((s) => s.status === "resolved").length;

  return (
    <>
      <Entete titre="Carte" />
      <main className="flex flex-1 flex-col gap-3 p-3">
        {isError && (
          <div className="flex items-center justify-between rounded-xl bg-erreur-fond p-3 text-sm text-erreur">
            Impossible de charger les signalements.
            <button type="button" onClick={() => refetch()} className="min-h-11 rounded-lg bg-surface px-4 font-semibold">
              Réessayer
            </button>
          </div>
        )}
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg bg-surface px-3 py-1 shadow-sm">{isPending ? "Chargement…" : `${liste.length} signalements`}</span>
          <span className="rounded-lg bg-surface px-3 py-1 shadow-sm">{resolus} résolus</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFiltre(null)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${!filtre ? "bg-violet text-sur-marque" : "bg-surface"}`}
          >
            Tout
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.code}
              onClick={() => setFiltre(c.code)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${filtre === c.code ? "bg-violet text-sur-marque" : "bg-surface"}`}
            >
              {c.icone} {c.libelle}
            </button>
          ))}
        </div>
        <MapView marqueurs={marqueurs} selection={selection} onSelection={setSelection} className="h-[55dvh] w-full rounded-xl" />
        <div className="flex flex-wrap gap-3 text-xs">
          {ORDRE_STATUTS.map((st) => (
            <span key={st} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: STATUTS[st].couleur }} /> {STATUTS[st].libelle}
            </span>
          ))}
        </div>
        {choisi && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 shadow">
            <div>
              <p className="font-semibold"><LibelleCategorie code={choisi.category} /></p>
              <p className="text-xs text-encre-pale">Signalé {depuis(choisi.created_at)} · {choisi.support_count} habitant(s)</p>
              <BadgeStatut statut={choisi.status} />
            </div>
            <Link href={`/suivi/${choisi.tracking_code}`} className="flex min-h-11 items-center rounded-lg bg-violet px-4 text-sm text-sur-marque">
              Détails
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
