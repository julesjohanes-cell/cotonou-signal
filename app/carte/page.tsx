"use client";
// ÉQUIPE PUBLIC — carte de Cotonou (points du problème uniquement, jamais la position du citoyen)
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeStatut, Entete, LibelleCategorie, dateCourte } from "@/components/ui";
import { MapView, type Marqueur } from "@/components/carte";
import { listerPublic } from "@/lib/api";
import { CATEGORIES, STATUTS, categorie } from "@/lib/categories";
import type { CategorieCode, SignalementPublic } from "@/lib/types";

export default function Carte() {
  const [liste, setListe] = useState<SignalementPublic[]>([]);
  const [filtre, setFiltre] = useState<CategorieCode | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    const charger = () => listerPublic().then(setListe).catch(console.error);
    charger();
    const t = setInterval(charger, 15000);
    return () => clearInterval(t);
  }, []);

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
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg bg-white px-3 py-1 shadow-sm">{liste.length} signalements</span>
          <span className="rounded-lg bg-white px-3 py-1 shadow-sm">{resolus} résolus</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltre(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${!filtre ? "bg-violet-900 text-white" : "bg-white"}`}
          >
            Tout
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setFiltre(c.code)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${filtre === c.code ? "bg-violet-900 text-white" : "bg-white"}`}
            >
              {c.icone} {c.libelle}
            </button>
          ))}
        </div>
        <MapView marqueurs={marqueurs} selection={selection} onSelection={setSelection} className="h-[60vh] w-full rounded-xl" />
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUTS).filter(([k]) => k !== "rejete").map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: v.couleur }} /> {v.libelle}
            </span>
          ))}
        </div>
        {choisi && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow">
            <div>
              <p className="font-semibold"><LibelleCategorie code={choisi.categorie} /></p>
              <p className="text-xs text-gray-500">{dateCourte(choisi.cree_le)} · {choisi.nb_confirmations} confirmation(s)</p>
              <BadgeStatut statut={choisi.statut} />
            </div>
            <Link href={`/suivi/${choisi.numero_suivi}`} className="rounded-lg bg-violet-900 px-3 py-2 text-sm text-white">
              Détails
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
