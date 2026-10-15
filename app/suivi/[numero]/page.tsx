"use client";
// ÉQUIPE WHATSAPP + SUIVI — suivi d'un signalement (aucune donnée personnelle)
import { useParams } from "next/navigation";
import { BadgeStatut, Entete, LibelleCategorie } from "@/components/ui";
import { MapView } from "@/components/carte";
import { useSuivi } from "@/hooks/useSignalements";
import { ORDRE_STATUTS, STATUTS, categorie } from "@/lib/categories";
import { dateCourte, depuis } from "@/lib/dates";

export default function Suivi() {
  const { numero } = useParams<{ numero: string }>();
  const { data: s, isPending, error } = useSuivi(decodeURIComponent(numero));
  const etapeAtteinte = s ? ORDRE_STATUTS.indexOf(s.statut) : -1;

  return (
    <>
      <Entete titre="Suivi" retour="/suivi" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        {error && <p className="rounded-xl bg-red-50 p-4 text-red-800">{error.message}</p>}
        {isPending && <p className="text-center text-gray-500">Chargement…</p>}
        {s && (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm text-gray-500">{s.numero_suivi}</p>
                <h1 className="text-xl font-bold text-violet-950">
                  <LibelleCategorie code={s.categorie} />
                </h1>
                <p className="text-sm text-gray-500">Service : {categorie(s.categorie).service}</p>
              </div>
              <BadgeStatut statut={s.statut} />
            </div>

            <ol className="flex gap-1">
              {ORDRE_STATUTS.map((st, i) => (
                <li key={st} className="flex-1">
                  <div className={`h-2 rounded-full ${i <= etapeAtteinte ? "bg-violet-900" : "bg-violet-100"}`} />
                  <p className="mt-1 text-xs">{STATUTS[st].libelle}</p>
                </li>
              ))}
            </ol>

            {s.nb_confirmations > 1 && (
              <p className="text-sm text-violet-900">👥 Confirmé par {s.nb_confirmations} habitants</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {s.photo_url && (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.photo_url} alt="Avant" className="h-40 w-full rounded-xl object-cover" />
                  <figcaption className="text-xs text-gray-500">Avant</figcaption>
                </figure>
              )}
              {s.photo_apres_url && (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.photo_apres_url} alt="Après" className="h-40 w-full rounded-xl object-cover" />
                  <figcaption className="text-xs text-gray-500">Après</figcaption>
                </figure>
              )}
            </div>

            <MapView
              marqueurs={[{ id: s.numero_suivi, lat: s.lat, lng: s.lng, couleur: STATUTS[s.statut].couleur, contenu: categorie(s.categorie).icone }]}
              selection={s.numero_suivi}
              className="h-56 w-full rounded-xl"
            />
            <p className="text-xs text-gray-500">
              Signalé {depuis(s.cree_le)} ({dateCourte(s.cree_le)}) · mis à jour {depuis(s.mis_a_jour_le)}
            </p>
          </>
        )}
      </main>
    </>
  );
}
