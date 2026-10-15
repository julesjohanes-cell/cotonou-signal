"use client";
// ÉQUIPE CARTE — carte de Cotonou (points du problème uniquement, jamais la position du citoyen)
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeStatut, Entete, LibelleCategorie } from "@/components/ui";
import { MapView, type Marqueur } from "@/components/carte";
import { useSignalementsPublics } from "@/hooks/useSignalements";
import { CATEGORIES, STATUTS, categorie } from "@/lib/categories";
import { depuis } from "@/lib/dates";
import type { CategorieCode } from "@/lib/types";

export default function Carte() {
  const { data, isPending, isError, refetch } = useSignalementsPublics();
  const [filtre, setFiltre] = useState<CategorieCode | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  const liste = useMemo(() => data ?? [], [data]);
  const visibles = useMemo(() => liste.filter((s) => !filtre || s.categorie === filtre), [liste, filtre]);
  const marqueurs: Marqueur[] = useMemo(
    () =>
      visibles.map((s) => ({
        id: s.numero_suivi,
        lat: s.lat,
        lng: s.lng,
        couleur: STATUTS[s.statut].couleur,
        contenu: categorie(s.categorie).icone,
        titre: categorie(s.categorie).libelle,
        badge: s.nb_confirmations,
      })),
    [visibles],
  );
  const choisi = liste.find((s) => s.numero_suivi === selection);
  const resolus = liste.filter((s) => s.statut === "resolu").length;

  return (
    <>
      <Entete titre="Carte" />
      <main className="flex flex-1 flex-col gap-3 p-3">
        {isError && (
          <div className="flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-800">
            Impossible de charger les signalements.
            <button type="button" onClick={() => refetch()} className="min-h-11 rounded-lg bg-white px-4 font-semibold">
              Réessayer
            </button>
          </div>
        )}
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg bg-white px-3 py-1 shadow-sm">{isPending ? "Chargement…" : `${liste.length} signalements`}</span>
          <span className="rounded-lg bg-white px-3 py-1 shadow-sm">{resolus} résolus</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFiltre(null)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${!filtre ? "bg-violet-900 text-white" : "bg-white"}`}
          >
            Tout
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.code}
              onClick={() => setFiltre(c.code)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${filtre === c.code ? "bg-violet-900 text-white" : "bg-white"}`}
            >
              {c.icone} {c.libelle}
            </button>
          ))}
        </div>
        <MapView marqueurs={marqueurs} selection={selection} onSelection={setSelection} className="h-[55dvh] w-full rounded-xl" />
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUTS)
            .filter(([k]) => k !== "rejete")
            .map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ background: v.couleur }} /> {v.libelle}
              </span>
            ))}
        </div>
        {choisi && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow">
            <div>
              <p className="font-semibold"><LibelleCategorie code={choisi.categorie} /></p>
              <p className="text-xs text-gray-500">Signalé {depuis(choisi.cree_le)} · {choisi.nb_confirmations} confirmation(s)</p>
              <BadgeStatut statut={choisi.statut} />
            </div>
            <Link href={`/suivi/${choisi.numero_suivi}`} className="flex min-h-11 items-center rounded-lg bg-violet-900 px-4 text-sm text-white">
              Détails
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
