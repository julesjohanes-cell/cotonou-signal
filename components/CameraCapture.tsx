"use client";
// Prise de photo EN DIRECT (appareil photo arrière), compressée avant envoi.
// capture="environment" ouvre directement l'appareil photo sur Android/iOS.
// Contrôle indicatif de fraîcheur ; la vraie vérification (capture d'écran, IA) est faite par le serveur.
import { useRef, useState } from "react";
import { compresserImage, photoRecente } from "@/lib/image";

const TAILLE_MAX_OCTETS = 15 * 1024 * 1024;

export interface PhotoPrise {
  blob: Blob;
  apercu: string; // URL locale pour l'aperçu
  prise_le: number;
}

interface Props {
  onPhoto: (p: PhotoPrise) => void;
  libelle?: string;
}

export default function CameraCapture({ onPhoto, libelle = "Prendre la photo" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [travail, setTravail] = useState(false);

  async function choisi(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permet de reprendre la même photo
    if (!f) return;
    setErreur(null);
    if (!f.type.startsWith("image/")) return setErreur("Ce fichier n'est pas une photo.");
    if (f.size > TAILLE_MAX_OCTETS) return setErreur("Photo trop lourde (15 Mo maximum).");
    if (!photoRecente(f)) return setErreur("Prends la photo maintenant, sur place (pas depuis la galerie).");
    setTravail(true);
    const blob = await compresserImage(f);
    setTravail(false);
    onPhoto({ blob, apercu: URL.createObjectURL(blob), prise_le: Date.now() });
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={choisi} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={travail}
        className="rounded-xl bg-violet-900 px-5 py-4 text-lg font-semibold text-white active:scale-[.98] disabled:opacity-60"
      >
        {travail ? "Préparation…" : `📷 ${libelle}`}
      </button>
      {erreur && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
    </div>
  );
}
