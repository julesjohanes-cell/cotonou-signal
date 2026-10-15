// Données simulées : permettent au front d'avancer sans attendre Django.
// Activées par défaut ; NEXT_PUBLIC_MOCKS=0 pour brancher le vrai back.
// Mêmes formes que le contrat (contrat/openapi.yaml) : passer au vrai back ne change aucun écran.
import type { SignalementAgent, Statut } from "./types";
import { CATEGORIES, categorie } from "./categories";

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

const CATS = CATEGORIES.filter((c) => c.code !== "autre").map((c) => c.code);
const STATS: Statut[] = ["published", "published", "in_progress", "resolved"];

// Pseudo-aléatoire déterministe (mêmes points à chaque rechargement)
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Code de suivi au format du back : « CS- » + 6 caractères, ex. CS-7K3F9Q. */
export function codeSuivi(n: number): string {
  return `CS-${((n * 2_654_435_761) % 36 ** 6).toString(36).toUpperCase().padStart(6, "0")}`;
}

function genere(): SignalementAgent[] {
  const out: SignalementAgent[] = [];
  for (let i = 0; i < 24; i++) {
    const q = QUARTIERS[i % QUARTIERS.length];
    const cat = CATS[Math.floor(rand(i + 1) * CATS.length)];
    const status = STATS[Math.floor(rand(i + 50) * STATS.length)];
    const jours = Math.floor(rand(i + 100) * 20);
    const date = new Date(Date.now() - jours * 86_400_000).toISOString();
    out.push({
      tracking_code: codeSuivi(i + 1),
      category: cat,
      category_label: categorie(cat).libelle,
      status,
      description: `Signalé à ${q.nom}`,
      lat: q.lat + (rand(i + 200) - 0.5) * 0.006,
      lng: q.lng + (rand(i + 300) - 0.5) * 0.006,
      photo_url: "",
      photo_after_url: null,
      support_count: 1 + Math.floor(rand(i + 400) * 4),
      created_at: date,
      updated_at: date,
      resolved_at: status === "resolved" ? date : null,
      history: [{ from_status: "pending", to_status: "published", note: "", at: date }],
      channel: i % 3 === 0 ? "whatsapp" : "web",
      ai_verdict: { matches_category: true, confidence: 0.9, reason: "Verdict simulé." },
    });
  }
  return out;
}

// Stock en mémoire (navigateur) : les créations apparaissent sur la carte pendant la session
export const mockStore: { signalements: SignalementAgent[]; compteur: number } = {
  signalements: genere(),
  compteur: 25,
};

export const attendre = (ms = 400) => new Promise((r) => setTimeout(r, ms));
