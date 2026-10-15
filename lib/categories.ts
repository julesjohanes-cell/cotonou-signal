import type { CategorieCode, Statut } from "./types";
import { COULEURS } from "./jetons";

export interface Categorie {
  code: CategorieCode;
  libelle: string;
  service: string;
  icone: string;
  couleur: string;
}

// V1 du brief : 8 catégories, chacune avec son service, + "Autre" (modération)
export const CATEGORIES: Categorie[] = [
  { code: "depot_ordures", libelle: "Dépôt sauvage d'ordures", service: "Collecte des déchets", icone: "🗑️", couleur: COULEURS.catDepotOrdures },
  { code: "caniveau_bouche", libelle: "Caniveau bouché", service: "Assainissement", icone: "🚧", couleur: COULEURS.catCaniveauBouche },
  { code: "brulage_dechets", libelle: "Brûlage de déchets", service: "Collecte, environnement", icone: "🔥", couleur: COULEURS.catBrulageDechets },
  { code: "eau_stagnante", libelle: "Eau stagnante ou inondation", service: "Assainissement", icone: "💧", couleur: COULEURS.catEauStagnante },
  { code: "chaussee_degradee", libelle: "Chaussée dégradée", service: "Services techniques", icone: "🛣️", couleur: COULEURS.catChausseeDegradee },
  { code: "regard_dangereux", libelle: "Regard ou dalle dangereux", service: "Services techniques", icone: "⚠️", couleur: COULEURS.catRegardDangereux },
  { code: "eclairage_panne", libelle: "Éclairage public en panne", service: "Éclairage public", icone: "💡", couleur: COULEURS.catEclairagePanne },
  { code: "vehicule_abandonne", libelle: "Véhicule ou objet abandonné", service: "Police municipale", icone: "🚗", couleur: COULEURS.catVehiculeAbandonne },
  { code: "autre", libelle: "Autre problème", service: "Modération", icone: "❓", couleur: COULEURS.catAutre },
];

export const SERVICES = Array.from(new Set(CATEGORIES.map((c) => c.service)));

export function categorie(code: CategorieCode): Categorie {
  return CATEGORIES.find((c) => c.code === code) ?? CATEGORIES[CATEGORIES.length - 1];
}

// Texte blanc lisible (4,5:1 au moins) sur chaque couleur de statut ; le libellé accompagne toujours la couleur.
export const STATUTS: Record<Statut, { libelle: string; couleur: string }> = {
  nouveau: { libelle: "Nouveau", couleur: COULEURS.statutNouveau },
  pris_en_charge: { libelle: "Pris en charge", couleur: COULEURS.statutPrisEnCharge },
  resolu: { libelle: "Résolu", couleur: COULEURS.statutResolu },
  rejete: { libelle: "Rejeté", couleur: COULEURS.statutRejete },
};

export const ORDRE_STATUTS: Statut[] = ["nouveau", "pris_en_charge", "resolu"];
