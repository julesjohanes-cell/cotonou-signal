// Données simulées : permettent au front d'avancer sans attendre Django.
// Activées par défaut ; NEXT_PUBLIC_MOCKS=0 pour brancher le vrai back.
import type { CategorieCode, SignalementMairie, Statut } from "./types";
import { categorie } from "./categories";

const QUARTIERS: { nom: string; lat: number; lng: number }[] = [
  { nom: "Dantokpa", lat: 6.3727, lng: 2.4295 },
  { nom: "Fidjrossè", lat: 6.3545, lng: 2.3565 },
  { nom: "Akpakpa", lat: 6.3655, lng: 2.4620 },
  { nom: "Cadjèhoun", lat: 6.3585, lng: 2.3915 },
  { nom: "Gbégamey", lat: 6.3660, lng: 2.4010 },
  { nom: "Agla", lat: 6.3850, lng: 2.3800 },
  { nom: "Zogbo", lat: 6.3880, lng: 2.4000 },
  { nom: "Sainte-Rita", lat: 6.3770, lng: 2.4120 },
  { nom: "Jéricho", lat: 6.3700, lng: 2.4180 },
  { nom: "Haie Vive", lat: 6.3560, lng: 2.3960 },
];

const CATS: CategorieCode[] = [
  "depot_ordures", "caniveau_bouche", "brulage_dechets", "eau_stagnante",
  "chaussee_degradee", "regard_dangereux", "eclairage_panne", "vehicule_abandonne",
];
const STATS: Statut[] = ["nouveau", "nouveau", "pris_en_charge", "resolu"];

// Pseudo-aléatoire déterministe (mêmes points à chaque rechargement)
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function genere(): SignalementMairie[] {
  const out: SignalementMairie[] = [];
  for (let i = 0; i < 24; i++) {
    const q = QUARTIERS[i % QUARTIERS.length];
    const cat = CATS[Math.floor(rand(i + 1) * CATS.length)];
    const statut = STATS[Math.floor(rand(i + 50) * STATS.length)];
    const jours = Math.floor(rand(i + 100) * 20);
    const date = new Date(Date.now() - jours * 86400000).toISOString();
    out.push({
      numero_suivi: `CS-2026-${String(i + 1).padStart(5, "0")}`,
      categorie: cat,
      statut,
      lat: q.lat + (rand(i + 200) - 0.5) * 0.006,
      lng: q.lng + (rand(i + 300) - 0.5) * 0.006,
      nb_confirmations: 1 + Math.floor(rand(i + 400) * 4),
      photo_url: null,
      photo_apres_url: null,
      cree_le: date,
      mis_a_jour_le: date,
      service: categorie(cat).service,
      source: i % 3 === 0 ? "whatsapp" : "web",
      precision_m: 8 + Math.floor(rand(i + 500) * 30),
      description: `Signalé à ${q.nom}`,
    });
  }
  return out;
}

// Stock en mémoire (navigateur) : les créations apparaissent sur la carte pendant la session
export const mockStore: { signalements: SignalementMairie[]; compteur: number } = {
  signalements: genere(),
  compteur: 25,
};

export const attendre = (ms = 400) => new Promise((r) => setTimeout(r, ms));
