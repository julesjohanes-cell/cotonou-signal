"use client";
// ÉQUIPE WHATSAPP + SUIVI — suivi d'un signalement (aucune donnée personnelle)
import { useParams } from "next/navigation";
import { BadgeStatut, Entete, LibelleCategorie } from "@/components/ui";
import { MapView } from "@/components/carte";
import { useSuivi } from "@/hooks/useSignalements";
import { ApiError } from "@/lib/api";
import { ORDRE_STATUTS, STATUTS, categorie, servicesDe } from "@/lib/categories";
import { dateCourte, depuis } from "@/lib/dates";
import type { Statut } from "@/lib/types";

export default function Suivi() {
  const { numero } = useParams<{ numero: string }>();
  const { data: s, isPending, error } = useSuivi(decodeURIComponent(numero));
  const etapeAtteinte = s ? ORDRE_STATUTS.indexOf(s.status) : -1;
  const introuvable = error instanceof ApiError && error.code === "NOT_FOUND";

  return (
    <>
      <Entete titre="Suivi" retour="/suivi" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        {error && (
          <p className="rounded-xl bg-erreur-fond p-4 text-erreur">
            {introuvable ? "Aucun signalement avec ce numéro de suivi. Vérifie le code (ex. CS-7K3F9Q)." : error.message}
          </p>
        )}
        {isPending && <p className="text-center text-encre-pale">Chargement…</p>}
        {s && (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm text-encre-pale">{s.tracking_code}</p>
                <h1 className="text-xl font-bold text-marque">
                  <LibelleCategorie code={s.category} />
                </h1>
                <p className="text-sm text-encre-pale">Service : {servicesDe(s.category)}</p>
              </div>
              <BadgeStatut statut={s.status} />
            </div>

            <ol className="flex gap-1">
              {ORDRE_STATUTS.map((st, i) => (
                <li key={st} className="flex-1">
                  <div className={`h-2 rounded-full ${i <= etapeAtteinte ? "bg-violet" : "bg-teinte"}`} />
                  <p className="mt-1 text-xs">{STATUTS[st].libelle}</p>
                </li>
              ))}
            </ol>

            {s.support_count > 1 && (
              <p className="text-sm text-violet">👥 Signalé par {s.support_count} habitants</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {s.photo_url && (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.photo_url} alt="Avant" className="h-40 w-full rounded-xl object-cover" />
                  <figcaption className="text-xs text-encre-pale">Avant</figcaption>
                </figure>
              )}
              {s.photo_after_url && (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.photo_after_url} alt="Après" className="h-40 w-full rounded-xl object-cover" />
                  <figcaption className="text-xs text-encre-pale">Après</figcaption>
                </figure>
              )}
            </div>

            <MapView
              marqueurs={[{ id: s.tracking_code, lat: s.lat, lng: s.lng, couleur: STATUTS[s.status].couleur, contenu: categorie(s.category).icone }]}
              selection={s.tracking_code}
              className="h-56 w-full rounded-xl"
            />

            {/* Historique : la note de l'agent est visible du citoyen, jamais son nom */}
            {s.history.length > 0 && (
              <ol className="flex flex-col gap-2 border-l-2 border-teinte pl-3">
                {s.history.map((h) => (
                  <li key={`${h.at}-${h.to_status}`} className="text-sm">
                    <span className="font-semibold">{STATUTS[h.to_status as Statut]?.libelle ?? h.to_status}</span>
                    <span className="text-encre-pale"> · {dateCourte(h.at)}</span>
                    {h.note && <p className="text-encre-douce">{h.note}</p>}
                  </li>
                ))}
              </ol>
            )}

            <p className="text-xs text-encre-pale">
              Signalé {depuis(s.created_at)} ({dateCourte(s.created_at)}) · mis à jour {depuis(s.updated_at)}
            </p>
          </>
        )}
      </main>
    </>
  );
}
