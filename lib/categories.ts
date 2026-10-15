import type { CategorieCode, Statut } from "./types";

export interface Categorie {
  code: CategorieCode;
  libelle: string;
  service: string;
  icone: string;
  couleur: string;
}

// V1 du brief : 8 catégories, chacune avec son service, + "Autre" (modération)
export const CATEGORIES: Categorie[] = [
  { code: "depot_ordures", libelle: "Dépôt sauvage d'ordures", service: "Collecte des déchets", icone: "🗑️", couleur: "#7c3aed" },
  { code: "caniveau_bouche", libelle: "Caniveau bouché", service: "Assainissement", icone: "🚧", couleur: "#0891b2" },
  { code: "brulage_dechets", libelle: "Brûlage de déchets", service: "Collecte, environnement", icone: "🔥", couleur: "#dc2626" },
  { code: "eau_stagnante", libelle: "Eau stagnante ou inondation", service: "Assainissement", icone: "💧", couleur: "#2563eb" },
  { code: "chaussee_degradee", libelle: "Chaussée dégradée", service: "Services techniques", icone: "🛣️", couleur: "#a16207" },
  { code: "regard_dangereux", libelle: "Regard ou dalle dangereux", service: "Services techniques", icone: "⚠️", couleur: "#ea580c" },
  { code: "eclairage_panne", libelle: "Éclairage public en panne", service: "Éclairage public", icone: "💡", couleur: "#ca8a04" },
  { code: "vehicule_abandonne", libelle: "Véhicule ou objet abandonné", service: "Police municipale", icone: "🚗", couleur: "#475569" },
  { code: "autre", libelle: "Autre problème", service: "Modération", icone: "❓", couleur: "#6b7280" },
];

export const SERVICES = Array.from(new Set(CATEGORIES.map((c) => c.service)));

export function categorie(code: CategorieCode): Categorie {
  return CATEGORIES.find((c) => c.code === code) ?? CATEGORIES[CATEGORIES.length - 1];
}

export const STATUTS: Record<Statut, { libelle: string; couleur: string }> = {
  nouveau: { libelle: "Nouveau", couleur: "#dc2626" },
  pris_en_charge: { libelle: "Pris en charge", couleur: "#ea580c" },
  resolu: { libelle: "Résolu", couleur: "#16a34a" },
  rejete: { libelle: "Rejeté", couleur: "#6b7280" },
};

export const ORDRE_STATUTS: Statut[] = ["nouveau", "pris_en_charge", "resolu"];
