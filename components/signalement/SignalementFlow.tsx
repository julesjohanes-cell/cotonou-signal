"use client";
// Parcours citoyen en 4 étapes (brief p.8-9). Utilisé par /signaler ET /s/[token] (WhatsApp).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, categorie } from "@/lib/categories";
import type { CategorieCode, CreationReponse } from "@/lib/types";
import { ApiError, creerSignalement, messageRefus } from "@/lib/api";
import { PRECISION_MAX_M } from "@/lib/geo";
import { useGeolocalisation } from "@/hooks/useGeolocalisation";
import CameraCapture, { type PhotoPrise } from "@/components/CameraCapture";
import { PointPicker } from "@/components/carte";

type Etape = "categorie" | "photo" | "position" | "envoi" | "termine";
const ETAPES: Etape[] = ["categorie", "photo", "position"];
const REFUS_PHOTO = ["photo_hors_sujet", "capture_ecran", "photo_ancienne"];

export default function SignalementFlow({ token }: { token?: string }) {
  const [etape, setEtape] = useState<Etape>("categorie");
  const [cat, setCat] = useState<CategorieCode | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<PhotoPrise | null>(null);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [refus, setRefus] = useState<{ code: string; message: string } | null>(null);
  const [resultat, setResultat] = useState<CreationReponse | null>(null);
  const debut = useRef(0);
  const [duree, setDuree] = useState(0);
  const gps = useGeolocalisation();

  // Lance le GPS dès l'étape photo pour gagner du temps
  useEffect(() => {
    if (etape === "photo" && gps.etat === "inactif") gps.demarrer();
  }, [etape, gps]);

  useEffect(() => {
    debut.current = Date.now();
  }, []);

  // Tant que le citoyen n'a pas déplacé le marqueur, le point suit sa position GPS
  const pointEffectif = point ?? (gps.position ? { lat: gps.position.lat, lng: gps.position.lng } : null);

  async function publier() {
    if (!cat || !photo || !gps.position || !pointEffectif) return;
    setRefus(null);
    setEtape("envoi");
    try {
      const r = await creerSignalement({
        categorie: cat,
        photo: photo.blob,
        photo_prise_le: photo.prise_le,
        gps: gps.position,
        point: pointEffectif,
        description: description || undefined,
        token,
      });
      setResultat(r);
      setDuree(Math.round((Date.now() - debut.current) / 1000));
      setEtape("termine");
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError("inconnu", "Erreur inconnue");
      setRefus({ code: err.code, message: messageRefus(err.code, err.message) });
      setEtape(REFUS_PHOTO.includes(err.code) ? "photo" : "position");
      if (REFUS_PHOTO.includes(err.code)) setPhoto(null);
    }
  }

  if (etape === "termine" && resultat) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-violet-950">
          {resultat.doublon ? "Déjà signalé, ta confirmation compte (+1)" : "Signalement envoyé !"}
        </h2>
        <p className="text-sm text-gray-600">Numéro de suivi</p>
        <p className="rounded-xl bg-violet-100 px-6 py-3 font-mono text-2xl font-bold text-violet-950">
          {resultat.numero_suivi}
        </p>
        {token && <p className="text-sm text-gray-600">Tu vas recevoir la confirmation dans WhatsApp.</p>}
        <p className="text-xs text-gray-400">Fait en {duree} s</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/suivi/${resultat.numero_suivi}`} className="rounded-lg bg-violet-900 px-4 py-2 text-white">
            Suivre
          </Link>
          <Link href="/carte" className="rounded-lg border border-violet-900 px-4 py-2 text-violet-900">
            Voir la carte
          </Link>
        </div>
      </div>
    );
  }

  const indice = ETAPES.indexOf(etape === "envoi" ? "position" : etape);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Progression */}
      <div className="flex gap-1">
        {ETAPES.map((e, i) => (
          <div key={e} className={`h-1.5 flex-1 rounded-full ${i <= indice ? "bg-violet-900" : "bg-violet-100"}`} />
        ))}
      </div>

      {refus && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
          <p className="font-semibold">Signalement refusé</p>
          <p className="text-sm">{refus.message}</p>
        </div>
      )}

      {etape === "categorie" && (
        <>
          <h2 className="text-xl font-bold text-violet-950">Quel est le problème ?</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCat(c.code);
                  if (c.code !== "autre") setEtape("photo");
                }}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left active:scale-[.98] ${
                  cat === c.code ? "border-violet-900 bg-violet-50" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl">{c.icone}</span>
                <span className="text-sm font-semibold leading-tight">{c.libelle}</span>
              </button>
            ))}
          </div>
          {cat === "autre" && (
            <div className="flex flex-col gap-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décris le problème en quelques mots (un lieu, pas une personne)"
                className="rounded-xl border p-3"
                rows={3}
              />
              <button type="button" onClick={() => setEtape("photo")} className="rounded-xl bg-violet-900 py-3 font-semibold text-white">
                Continuer
              </button>
            </div>
          )}
        </>
      )}

      {etape === "photo" && cat && (
        <>
          <h2 className="text-xl font-bold text-violet-950">
            {categorie(cat).icone} Photographie le problème
          </h2>
          <p className="text-sm text-gray-600">Sur place, maintenant. Cadre le problème, pas les personnes.</p>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.apercu} alt="Aperçu" className="max-h-72 w-full rounded-xl object-cover" />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPhoto(null)} className="rounded-xl border py-3">
                  Reprendre
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRefus(null);
                    setEtape("position");
                  }}
                  className="rounded-xl bg-violet-900 py-3 font-semibold text-white"
                >
                  Continuer
                </button>
              </div>
            </>
          ) : (
            <CameraCapture onPhoto={setPhoto} />
          )}
          <button type="button" onClick={() => setEtape("categorie")} className="text-sm text-violet-900 underline">
            Changer de catégorie
          </button>
        </>
      )}

      {(etape === "position" || etape === "envoi") && (
        <>
          <h2 className="text-xl font-bold text-violet-950">Place le point exact</h2>
          <EtatGps etat={gps.etat} precision={gps.position?.precision_m} onRelancer={gps.demarrer} />
          {gps.position && pointEffectif && (gps.etat === "ok" || gps.etat === "recherche") && (
            <>
              <p className="text-sm text-gray-600">Déplace le marqueur sur le problème (100 m max autour de toi).</p>
              <PointPicker gps={gps.position} point={pointEffectif} onChange={setPoint} />
              <button
                type="button"
                onClick={publier}
                disabled={etape === "envoi" || gps.etat !== "ok"}
                className="rounded-xl bg-lime-400 py-4 text-lg font-bold text-violet-950 disabled:opacity-50"
              >
                {etape === "envoi" ? "Vérification en cours…" : "Publier le signalement"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function EtatGps({ etat, precision, onRelancer }: { etat: string; precision?: number; onRelancer: () => void }) {
  const p = precision ? `± ${Math.round(precision)} m` : "";
  const msg: Record<string, [string, string]> = {
    inactif: ["bg-gray-50 text-gray-700", "GPS en attente…"],
    recherche: ["bg-amber-50 text-amber-800", `Recherche de ta position… ${p}`],
    ok: ["bg-green-50 text-green-800", `Position trouvée ${p}`],
    imprecis: ["bg-red-50 text-red-800", `Position trop imprécise ${p} (max ${PRECISION_MAX_M} m). Mets-toi à découvert.`],
    hors_zone: ["bg-red-50 text-red-800", "Tu sembles être en dehors de Cotonou."],
    refuse: ["bg-red-50 text-red-800", "Autorise la localisation dans ton navigateur pour signaler."],
    erreur: ["bg-red-50 text-red-800", "GPS indisponible. La page doit être ouverte en HTTPS."],
  };
  const [cls, texte] = msg[etat] ?? msg.erreur;
  const relancer = ["imprecis", "hors_zone", "refuse", "erreur"].includes(etat);
  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl p-3 text-sm ${cls}`}>
      <span>📍 {texte}</span>
      {relancer && (
        <button type="button" onClick={onRelancer} className="shrink-0 rounded-lg bg-white px-3 py-1 font-semibold">
          Réessayer
        </button>
      )}
    </div>
  );
}
