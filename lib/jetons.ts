// Jetons du design system « Cotonou Signale », côté JavaScript : thème antd, marqueurs MapLibre, métadonnées.
// Miroir exact du bloc @theme de app/globals.css ; tests/unit/jetons.test.ts vérifie qu'ils restent identiques.
// Dans un composant, utiliser les classes Tailwind (bg-marque, text-encre-douce…) ; ces valeurs servent
// seulement là où une classe ne peut pas aller (antd, styles des marqueurs, peinture des couches de carte).

export const COULEURS = {
  // Marque (brief)
  marque: "#3a0c6f",
  violet: "#481689",
  citron: "#bae206",
  // Texte
  encre: "#1b1327",
  encreDouce: "#4d445f",
  encrePale: "#6d657f",
  surMarque: "#ffffff",
  surMarqueDoux: "#dbd1eb",
  surCitron: "#3a0c6f",
  // Fonds, filets, focus
  fond: "#f9f8fb",
  surface: "#ffffff",
  teinte: "#efebf5",
  filet: "#dbd4e5",
  contour: "#6d657f",
  focus: "#481689",
  focusSurMarque: "#bae206",
  // États
  erreurFond: "oklch(97.1% 0.013 17.38)",
  erreurFilet: "oklch(88.5% 0.062 18.334)",
  erreur: "oklch(44.4% 0.177 26.899)",
  succesFond: "oklch(98.2% 0.018 155.826)",
  succes: "oklch(44.8% 0.119 151.328)",
  attenteFond: "oklch(98.7% 0.022 95.277)",
  attente: "oklch(47.3% 0.137 46.201)",
  neutreFond: "oklch(98.5% 0.002 247.839)",
  neutre: "oklch(37.3% 0.034 259.733)",
  // Statuts : texte sur-marque lisible à 4,5:1 au moins sur chacun
  statutNouveau: "#dc2626",
  statutPrisEnCharge: "#c2410c",
  statutResolu: "#15803d",
  statutRejete: "#6b7280",
  // Carte
  pastilleConfirmations: "#1e1b4b",
  positionCitoyen: "#2563eb",
  // Catégories (lib/categories.ts)
  catDepotOrdures: "#7c3aed",
  catCaniveauBouche: "#0891b2",
  catBrulageDechets: "#dc2626",
  catEauStagnante: "#2563eb",
  catChausseeDegradee: "#a16207",
  catRegardDangereux: "#ea580c",
  catEclairagePanne: "#ca8a04",
  catVehiculeAbandonne: "#475569",
  catAutre: "#6b7280",
} as const;

export const RAYONS = {
  /** Rayon unique des composants Ant Design (espace mairie). */
  agents: 10,
} as const;

export const OMBRES = {
  marqueur: "0 1px 4px rgba(0,0,0,0.4)",
} as const;

/** Nom CSS d'un jeton de couleur : encreDouce → --color-encre-douce. */
export function variableCss(nom: keyof typeof COULEURS): string {
  return `--color-${nom.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
}
