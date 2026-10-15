"use client";
// ÉQUIPE MAIRIE — espace agent / élu : voir les points, changer le statut, ajouter la photo "après"
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeStatut, Entete, LibelleCategorie, dateCourte } from "@/components/ui";
import { MapView, type Marqueur } from "@/components/carte";
import CameraCapture from "@/components/CameraCapture";
import { ajouterPhotoApres, changerStatut, connexion, deconnexion, lireSession, listerMairie, ApiError } from "@/lib/api";
import { ORDRE_STATUTS, SERVICES, STATUTS, categorie } from "@/lib/categories";
import type { Session, SignalementMairie, Statut } from "@/lib/types";

export default function Mairie() {
  const [session, setSession] = useState<Session | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setSession(lireSession());
    setPret(true);
  }, []);

  if (!pret) return null;
  return (
    <>
      <Entete titre="Espace mairie" />
      {session ? (
        <TableauDeBord session={session} onDeconnexion={() => { deconnexion(); setSession(null); }} />
      ) : (
        <Connexion onConnecte={setSession} />
      )}
    </>
  );
}

function Connexion({ onConnecte }: { onConnecte: (s: Session) => void }) {
  const [id, setId] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-3 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setErreur(null);
        try {
          onConnecte(await connexion(id, mdp));
        } catch (err) {
          setErreur(err instanceof ApiError ? err.message : "Connexion impossible");
        }
      }}
    >
      <h1 className="text-xl font-bold text-violet-950">Connexion agent</h1>
      <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Identifiant (« elu » pour la vue élu en mock)" className="rounded-xl border p-3" />
      <input value={mdp} onChange={(e) => setMdp(e.target.value)} type="password" placeholder="Mot de passe" className="rounded-xl border p-3" />
      {erreur && <p className="text-sm text-red-700">{erreur}</p>}
      <button className="rounded-xl bg-violet-900 py-3 font-semibold text-white">Se connecter</button>
    </form>
  );
}

function TableauDeBord({ session, onDeconnexion }: { session: Session; onDeconnexion: () => void }) {
  const [liste, setListe] = useState<SignalementMairie[]>([]);
  const [statut, setStatut] = useState<Statut | "">("");
  const [service, setService] = useState(session.service ?? "");
  const [selection, setSelection] = useState<string | null>(null);

  const charger = useCallback(() => {
    listerMairie({ statut: statut || undefined, service: service || undefined })
      .then(setListe)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) onDeconnexion();
      });
  }, [statut, service, onDeconnexion]);

  // Rafraîchissement auto : le signalement fait en direct apparaît pendant la démo
  useEffect(() => {
    charger();
    const t = setInterval(charger, 10000);
    return () => clearInterval(t);
  }, [charger]);

  const marqueurs: Marqueur[] = useMemo(
    () =>
      liste.map((s) => ({
        id: s.numero_suivi, lat: s.lat, lng: s.lng, couleur: STATUTS[s.statut].couleur,
        contenu: categorie(s.categorie).icone, titre: categorie(s.categorie).libelle, badge: s.nb_confirmations,
      })),
    [liste],
  );
  const choisi = liste.find((s) => s.numero_suivi === selection) ?? null;

  const stats = useMemo(() => {
    const n = (st: Statut) => liste.filter((s) => s.statut === st).length;
    const total = liste.length;
    return { total, nouveau: n("nouveau"), encours: n("pris_en_charge"), resolu: n("resolu"), taux: total ? Math.round((n("resolu") / total) * 100) : 0 };
  }, [liste]);

  async function majStatut(st: Statut) {
    if (!choisi) return;
    const maj = await changerStatut(choisi.numero_suivi, st);
    setListe((l) => l.map((s) => (s.numero_suivi === maj.numero_suivi ? maj : s)));
  }

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <div className="flex items-center justify-between text-sm">
        <span>Connecté : <b>{session.nom}</b> ({session.role})</span>
        <button onClick={onDeconnexion} className="text-violet-900 underline">Déconnexion</button>
      </div>

      {/* Chiffres pour l'élu */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[["Total", stats.total], ["Nouveaux", stats.nouveau], ["En cours", stats.encours], ["Résolus", `${stats.resolu} (${stats.taux} %)`]].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white p-2 shadow-sm">
            <p className="text-lg font-bold text-violet-950">{v}</p>
            <p className="text-xs text-gray-500">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={statut} onChange={(e) => setStatut(e.target.value as Statut | "")} className="rounded-lg border bg-white p-2 text-sm">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.libelle}</option>)}
        </select>
        <select value={service} onChange={(e) => setService(e.target.value)} className="rounded-lg border bg-white p-2 text-sm">
          <option value="">Tous les services</option>
          {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MapView marqueurs={marqueurs} selection={selection} onSelection={setSelection} className="h-80 w-full rounded-xl md:h-[70vh]" />
        <div className="flex flex-col gap-2 md:h-[70vh] md:overflow-y-auto">
          {choisi && (
            <div className="rounded-xl border-2 border-violet-900 bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-500">{choisi.numero_suivi} · {choisi.source} · ± {choisi.precision_m} m</p>
                  <p className="font-semibold"><LibelleCategorie code={choisi.categorie} /></p>
                  <p className="text-xs text-gray-500">{choisi.service} · {dateCourte(choisi.cree_le)}</p>
                  {choisi.description && <p className="text-sm">{choisi.description}</p>}
                </div>
                <button onClick={() => setSelection(null)} aria-label="Fermer">✕</button>
              </div>
              <div className="my-2 grid grid-cols-2 gap-2">
                {choisi.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={choisi.photo_url} alt="Avant" className="h-32 w-full rounded-lg object-cover" />
                ) : <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">Pas de photo</div>}
                {choisi.photo_apres_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={choisi.photo_apres_url} alt="Après" className="h-32 w-full rounded-lg object-cover" />
                ) : <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">Photo après : à venir</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                {[...ORDRE_STATUTS, "rejete" as Statut].map((st) => (
                  <button
                    key={st}
                    onClick={() => majStatut(st)}
                    disabled={choisi.statut === st}
                    className="rounded-lg border px-3 py-1 text-sm disabled:border-violet-900 disabled:bg-violet-900 disabled:text-white"
                  >
                    {STATUTS[st].libelle}
                  </button>
                ))}
              </div>
              {choisi.statut === "resolu" && !choisi.photo_apres_url && (
                <div className="mt-2">
                  <CameraCapture
                    libelle="Ajouter la photo après"
                    onPhoto={async (p) => {
                      const maj = await ajouterPhotoApres(choisi.numero_suivi, p.blob);
                      setListe((l) => l.map((s) => (s.numero_suivi === maj.numero_suivi ? maj : s)));
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {liste.map((s) => (
            <button
              key={s.numero_suivi}
              onClick={() => setSelection(s.numero_suivi)}
              className={`flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-left shadow-sm ${s.numero_suivi === selection ? "ring-2 ring-violet-900" : ""}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold"><LibelleCategorie code={s.categorie} /></p>
                <p className="text-xs text-gray-500">{s.numero_suivi} · {dateCourte(s.cree_le)}{s.nb_confirmations > 1 ? ` · +${s.nb_confirmations - 1}` : ""}</p>
              </div>
              <BadgeStatut statut={s.statut} />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
