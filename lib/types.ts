// Contrat d'API avec Django. Source de vérité : contrat/openapi.yaml (copie de docs/openapi.yaml du dépôt back).
// Les types sont générés dans lib/generated/ par `pnpm api:generate` : on ne les retape jamais,
// on les ré-exporte ou on les dérive ici. Le contrat change ? `pnpm api:sync`, puis on adapte le front dans la même PR.
import type {
  AgentReport,
  AgentStatusEnum,
  ChannelEnum,
  LoginResult,
  ReportDetail,
  ReportStatusEnum,
} from "./generated/api-django";

export type {
  AgentReport,
  AgentReportList,
  CaptureSessionCreated,
  CaptureSessionState,
  Category,
  LoginRequest,
  LoginResult,
  ReportCreated,
  ReportDetail,
  StatusChange,
} from "./generated/api-django";

/** pending, rejected, moderation, published, in_progress, resolved. */
export type Statut = ReportStatusEnum;
/** Ce qu'un agent peut demander : in_progress puis resolved. */
export type StatutAgent = AgentStatusEnum;
export type Canal = ChannelEnum;

// Le schéma marque « facultatifs » les champs qui ont une valeur par défaut côté Django (statut, compteur…),
// mais l'API les renvoie toujours : ces deux types le disent une fois pour toutes.
/** GET /reports/{tracking_code} : suivi citoyen. Jamais de canal, de verdict IA ni de position du citoyen. */
export type Suivi = ReportDetail & Required<Pick<ReportDetail, "status" | "support_count" | "description">>;
/** GET /agent/reports : le suivi + le canal et le verdict IA, pour les agents uniquement. */
export type SignalementAgent = AgentReport &
  Required<Pick<AgentReport, "status" | "support_count" | "description" | "channel">>;

// ---------- GET /reports (carte) ----------
// Réponse GeoJSON, non décrite par le schéma OpenAPI : forme tirée de contrat/api-contract.md.
// ATTENTION : GeoJSON impose [longitude, latitude]. La conversion se fait à un seul endroit : depuisGeoJSON (lib/geo.ts).
export interface ProprietesCarte {
  tracking_code: string;
  category: string;
  status: Statut;
  support_count: number;
  photo_url: string;
  created_at: string;
}

export interface PointGeoJSON {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: ProprietesCarte;
}

export interface CarteGeoJSON {
  type: "FeatureCollection";
  features: PointGeoJSON[];
}

/** Un point de la carte, prêt pour l'interface : jamais la position du citoyen, seulement celle du problème. */
export type SignalementCarte = ProprietesCarte & { lat: number; lng: number };

// ---------- Erreurs ----------
/** Codes du contrat. Le front affiche `message` et se base sur `code`. */
export type CodeErreur =
  | "INVALID_INPUT"
  | "PHOTO_INVALID"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "TOKEN_USED"
  | "INVALID_TRANSITION"
  | "TOKEN_EXPIRED"
  | "OUT_OF_ZONE"
  | "TOO_FAR"
  | "GPS_INACCURATE"
  | "PHOTO_REUSED"
  | "PHOTO_MISMATCH"
  | "PHOTO_SCREENSHOT"
  | "RATE_LIMITED";

/** Forme unique de toute erreur : celles de Django et celles des routes Next (/session, proxy.ts). */
export interface CorpsErreur {
  error: { code: CodeErreur | string; message: string; details?: Record<string, unknown> };
}

// ---------- Session agent (bonus) ----------
/** Ce que l'interface connaît de l'agent connecté (cookie cs_profil) : identifiant et services, aucun secret. */
export type Profil = LoginResult["user"];
