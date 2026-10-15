import type { Statut } from "./types";
import { COULEURS } from "./jetons";

// Les 8 catégories du brief + « Autre » (modération). Slugs, libellés et services identiques au back
// (fixture reports/fixtures/categories.json et migration des services) : GET /categories renvoie les mêmes.
// Gardées ici pour afficher l'écran de choix sans attendre le réseau, avec leur icône.
export const CATEGORIES = [
  { code: "depot_sauvage", libelle: "Dépôt sauvage d'ordures", services: ["Collecte des déchets"], icone: "🗑️", couleur: COULEURS.catDepotOrdures },
  { code: "caniveau_bouche", libelle: "Caniveau bouché", services: ["Assainissement"], icone: "🚧", couleur: COULEURS.catCaniveauBouche },
  { code: "brulage_dechets", libelle: "Brûlage de déchets", services: ["Collecte des déchets", "Environnement"], icone: "🔥", couleur: COULEURS.catBrulageDechets },
  { code: "eau_stagnante", libelle: "Eau stagnante ou inondation", services: ["Assainissement"], icone: "💧", couleur: COULEURS.catEauStagnante },
  { code: "chaussee_degradee", libelle: "Chaussée dégradée", services: ["Services techniques"], icone: "🛣️", couleur: COULEURS.catChausseeDegradee },
  { code: "regard_dalle", libelle: "Regard ou dalle dangereux", services: ["Services techniques"], icone: "⚠️", couleur: COULEURS.catRegardDangereux },
  { code: "eclairage_panne", libelle: "Éclairage public en panne", services: ["Éclairage public"], icone: "💡", couleur: COULEURS.catEclairagePanne },
  { code: "vehicule_abandonne", libelle: "Véhicule ou objet abandonné", services: ["Police municipale"], icone: "🚗", couleur: COULEURS.catVehiculeAbandonne },
  // Sans service : passe en modération, traitée par l'administrateur dans Django admin
  { code: "autre", libelle: "Autre problème", services: [], icone: "❓", couleur: COULEURS.catAutre },
] as const;

export type Categorie = (typeof CATEGORIES)[number];
export type CategorieCode = Categorie["code"];

/** L'API renvoie un slug (chaîne) : un slug inconnu s'affiche comme « Autre problème ». */
export function categorie(code: string): Categorie {
  return CATEGORIES.find((c) => c.code === code) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Services chargés du problème, en clair (« Modération » pour « Autre »). */
export function servicesDe(code: string): string {
  const s = categorie(code).services;
  return s.length ? s.join(", ") : "Modération";
}

// Libellés repris du back (choix du modèle Report).
// Texte blanc lisible (4,5:1 au moins) sur chaque couleur de statut ; le libellé accompagne toujours la couleur.
export const STATUTS: Record<Statut, { libelle: string; couleur: string }> = {
  pending: { libelle: "En cours de vérification", couleur: COULEURS.neutre },
  rejected: { libelle: "Rejeté", couleur: COULEURS.statutRejete },
  moderation: { libelle: "En modération", couleur: COULEURS.violet },
  published: { libelle: "Publié", couleur: COULEURS.statutNouveau },
  in_progress: { libelle: "Pris en charge", couleur: COULEURS.statutPrisEnCharge },
  resolved: { libelle: "Résolu", couleur: COULEURS.statutResolu },
};

/** Les seuls statuts visibles du public (carte, suivi), dans l'ordre du parcours. */
export const ORDRE_STATUTS: Statut[] = ["published", "in_progress", "resolved"];
