// Contrat d'API partagé avec le back (Django). Toute modif = prévenir Jean + mettre à jour le README.

export type CategorieCode =
  | "depot_ordures"
  | "caniveau_bouche"
  | "brulage_dechets"
  | "eau_stagnante"
  | "chaussee_degradee"
  | "regard_dangereux"
  | "eclairage_panne"
  | "vehicule_abandonne"
  | "autre";

export type Statut = "nouveau" | "pris_en_charge" | "resolu" | "rejete";

export type Source = "web" | "whatsapp";

/** Ce que le public a le droit de voir. JAMAIS : téléphone, position GPS du citoyen, nom. */
export interface SignalementPublic {
  numero_suivi: string; // ex. "CS-2026-00042"
  categorie: CategorieCode;
  statut: Statut;
  lat: number; // position du PROBLÈME (point ajusté), pas celle du citoyen
  lng: number;
  nb_confirmations: number; // doublons regroupés : "+1"
  photo_url: string | null; // photo floutée (visages, plaques)
  photo_apres_url: string | null;
  cree_le: string; // ISO 8601
  mis_a_jour_le: string;
}

/** Vue agent mairie (authentifiée). */
export interface SignalementMairie extends SignalementPublic {
  service: string;
  source: Source;
  precision_m: number;
  description: string | null;
}

export interface CreationReponse {
  numero_suivi: string;
  statut: Statut;
  doublon: boolean; // true = rattaché à un signalement existant (+1)
}

export type CodeRefus =
  | "photo_hors_sujet"
  | "capture_ecran"
  | "photo_ancienne"
  | "hors_cotonou"
  | "trop_loin"
  | "precision_insuffisante"
  | "lien_expire"
  | "lien_utilise"
  | "non_autorise";

export interface ErreurApi {
  code: CodeRefus | string;
  message: string;
}

export interface LienWhatsApp {
  valide: boolean;
  raison?: "expire" | "utilise" | "inconnu";
  expire_a?: string;
}

/** Réponse de Django à la connexion. Le token ne quitte jamais le serveur Next (cookie httpOnly). */
export interface Session {
  token: string;
  nom: string;
  role: "agent" | "elu";
  service: string | null; // null = tous les services
}

/** Ce que l'interface connaît de l'agent connecté : aucun secret. */
export type Profil = Omit<Session, "token">;
