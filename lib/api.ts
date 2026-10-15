// Couche réseau unique (axios). Les écrans n'appellent jamais ce fichier directement :
// ils passent par les hooks TanStack Query de hooks/useSignalements.ts.
// Contrat : contrat/openapi.yaml. Préfixe /api/v1, snake_case, dates ISO,
// toute erreur au format {"error": {"code", "message", "details"}}.
import axios, { type AxiosError } from "axios";
import type {
  AgentReportList, CaptureSessionCreated, CaptureSessionState, CarteGeoJSON, CorpsErreur, LoginRequest, Profil,
  ReportCreated, SignalementAgent, SignalementCarte, Statut, StatutAgent, Suivi,
} from "./types";
import { COOKIE_PROFIL } from "./securite";
import { attendre, codeSuivi, mockStore } from "./mocks";
import { categorie, ORDRE_STATUTS, type CategorieCode } from "./categories";
import { depuisGeoJSON, DISTANCE_MAX_M, distanceM, estDansCotonou, PRECISION_MAX_M, type Position } from "./geo";

export const MOCKS = process.env.NEXT_PUBLIC_MOCKS !== "0";
const MOCK_REFUS = process.env.NEXT_PUBLIC_MOCK_REFUS; // ex. PHOTO_MISMATCH pour tester l'écran de refus

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 0,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

// ---------- Messages ----------
// En vrai, l'écran affiche le `message` envoyé par Django. Ces textes (repris de config/errors.py du back)
// servent au mode simulé, aux erreurs réseau et aux réponses sans message.
const MESSAGES: Record<string, string> = {
  INVALID_INPUT: "Certaines informations sont manquantes ou incorrectes.",
  UNAUTHENTICATED: "Connexion requise.",
  FORBIDDEN: "Vous n'avez pas le droit d'effectuer cette action.",
  NOT_FOUND: "Élément introuvable.",
  TOKEN_USED: "Ce lien de signalement a déjà été utilisé. Demandez-en un nouveau.",
  INVALID_TRANSITION: "Ce changement de statut n'est pas autorisé.",
  TOKEN_EXPIRED: "Ce lien de signalement a expiré. Demandez-en un nouveau.",
  PHOTO_INVALID: "La photo est illisible ou son format n'est pas accepté (JPEG, PNG ou WebP).",
  OUT_OF_ZONE: "Vous semblez être en dehors de Cotonou.",
  TOO_FAR: "Le point est trop loin de votre position.",
  GPS_INACCURATE: "Votre position GPS n'est pas assez précise. Attendez quelques secondes ou déplacez-vous.",
  PHOTO_REUSED: "Cette photo a déjà été utilisée pour un autre signalement.",
  PHOTO_MISMATCH: "La photo ne correspond pas à la catégorie choisie.",
  PHOTO_SCREENSHOT: "Les captures d'écran ne sont pas acceptées. Prenez la photo sur place.",
  RATE_LIMITED: "Trop de requêtes. Réessayez dans un instant.",
  NETWORK: "Connexion impossible. Vérifiez votre connexion internet.",
  TIMEOUT: "Le réseau est trop lent. Réessayez dans un instant.",
};

export function messageErreur(code: string, defaut?: string): string {
  return MESSAGES[code] ?? defaut ?? "Une erreur est survenue. Réessayez.";
}

/** Toute erreur axios devient une ApiError { code, message, status, details } : un seul format pour les écrans. */
export function versApiError(e: AxiosError<Partial<CorpsErreur>>): ApiError {
  if (!e.response) {
    const code = e.code === "ECONNABORTED" || e.code === "ETIMEDOUT" ? "TIMEOUT" : "NETWORK";
    return new ApiError(code, messageErreur(code));
  }
  const { status, data } = e.response;
  const err = typeof data === "object" && data ? data.error : undefined;
  const code = err?.code ?? `HTTP_${status}`;
  return new ApiError(code, err?.message || messageErreur(code, `Erreur du serveur (${status}).`), status, err?.details ?? {});
}

const erreurSimulee = (code: string, status = 422, details: Record<string, unknown> = {}) =>
  new ApiError(code, messageErreur(code), status, details);

// ---------- Session agent (bonus) ----------
// Le jeton DRF vit dans un cookie httpOnly posé par la route /session : le JavaScript ne le voit jamais
// (un script injecté ne peut pas le voler). proxy.ts l'ajoute aux appels /api/v1/agent.
// L'interface ne lit que le cookie de profil (identifiant, services), sans secret.
const EVT_SESSION = "cs-session";
const notifierSession = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT_SESSION));
};

/** Profil brut (chaîne stable entre deux rendus) pour useSyncExternalStore ; null si non connecté. */
export function lireProfilBrut(): string | null {
  if (typeof document === "undefined") return null;
  const c = document.cookie.split("; ").find((x) => x.startsWith(`${COOKIE_PROFIL}=`));
  if (!c) return null;
  try {
    const b64 = decodeURIComponent(c.slice(COOKIE_PROFIL.length + 1)).replace(/-/g, "+").replace(/_/g, "/");
    return new TextDecoder().decode(Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)));
  } catch {
    return null;
  }
}
export function abonnerSession(rappel: () => void): () => void {
  window.addEventListener(EVT_SESSION, rappel);
  return () => window.removeEventListener(EVT_SESSION, rappel);
}

// ---------- Client axios ----------
// Même origine : Next relaie /api vers Django (next.config.ts), donc pas de CORS.
const client = axios.create({ baseURL: "/api/v1", timeout: 30_000, headers: { Accept: "application/json" } });

client.interceptors.response.use(
  (r) => r,
  (e: AxiosError<Partial<CorpsErreur>>) => {
    if (e.response?.status === 401) notifierSession();
    return Promise.reject(versApiError(e));
  },
);

// ---------- Public : carte et suivi ----------
/** Champs publics uniquement (liste blanche) : jamais le canal, le verdict IA ni la position du citoyen. */
function versSuivi(s: SignalementAgent): Suivi {
  const { tracking_code, category, category_label, status, description, lat, lng, photo_url, photo_after_url } = s;
  const { support_count, created_at, updated_at, resolved_at, history } = s;
  return {
    tracking_code, category, category_label, status, description, lat, lng, photo_url, photo_after_url,
    support_count, created_at, updated_at, resolved_at, history,
  };
}

export async function listerCarte(): Promise<SignalementCarte[]> {
  if (MOCKS) {
    await attendre();
    // Même chemin que le vrai back : GeoJSON [lng, lat], puis conversion
    const fc: CarteGeoJSON = {
      type: "FeatureCollection",
      features: mockStore.signalements
        .filter((s) => ORDRE_STATUTS.includes(s.status))
        .map(({ tracking_code, category, status, support_count, photo_url, created_at, lat, lng }) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: { tracking_code, category, status, support_count, photo_url, created_at },
        })),
    };
    return depuisGeoJSON(fc);
  }
  return depuisGeoJSON((await client.get<CarteGeoJSON>("/reports")).data);
}

export async function suivre(trackingCode: string): Promise<Suivi> {
  const code = trackingCode.trim().toUpperCase();
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.tracking_code === code);
    if (!s) throw erreurSimulee("NOT_FOUND", 404);
    return versSuivi(s);
  }
  return (await client.get<Suivi>(`/reports/${encodeURIComponent(code)}`)).data;
}

// ---------- Liens de capture (WhatsApp et web) ----------
export async function creerLienCapture(): Promise<CaptureSessionCreated> {
  if (MOCKS) {
    await attendre(100);
    const token = `simule-${Date.now()}`;
    return { token, expires_at: new Date(Date.now() + 10 * 60_000).toISOString(), capture_url: `/capture/${token}` };
  }
  return (await client.post<CaptureSessionCreated>("/capture-sessions")).data;
}

/** 200 si le lien est utilisable ; sinon ApiError NOT_FOUND (404), TOKEN_USED (409) ou TOKEN_EXPIRED (410). */
export async function verifierLienCapture(token: string): Promise<CaptureSessionState> {
  if (MOCKS) {
    await attendre();
    if (token === "expire") throw erreurSimulee("TOKEN_EXPIRED", 410);
    if (token === "utilise") throw erreurSimulee("TOKEN_USED", 409);
    if (token === "inconnu") throw new ApiError("NOT_FOUND", "Ce lien de signalement est inconnu.", 404);
    return { valid: true, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() };
  }
  return (await client.get<CaptureSessionState>(`/capture-sessions/${encodeURIComponent(token)}`)).data;
}

// ---------- Création d'un signalement ----------
export interface NouveauSignalement {
  category: CategorieCode;
  photo: Blob;
  position: Position; // position du téléphone : vérifiée par le serveur, jamais publique
  point: { lat: number; lng: number }; // point du problème, ajusté sur la carte (100 m max)
  description?: string;
  jeton?: string; // lien de capture WhatsApp ; absent sur le web
  onProgression?: (pourcentage: number) => void; // envoi de la photo (réseau lent)
}

export async function creerSignalement(d: NouveauSignalement): Promise<ReportCreated> {
  if (MOCKS) return creerSignalementSimule(d);
  // Parcours web : un lien de capture à usage unique est demandé juste avant l'envoi (WhatsApp a déjà le sien).
  // Un refus (422) ne consomme pas le lien : le citoyen corrige et réessaie.
  const jeton = d.jeton ?? (await creerLienCapture()).token;
  const f = new FormData();
  f.append("category", d.category);
  if (d.description) f.append("description", d.description);
  // Nom de fichier neutre : le vérificateur simulé du back refuse un nom contenant « capture » ou « screenshot »
  f.append("photo", d.photo, "photo.jpg");
  f.append("point_lat", String(d.point.lat));
  f.append("point_lng", String(d.point.lng));
  f.append("device_lat", String(d.position.lat));
  f.append("device_lng", String(d.position.lng));
  f.append("device_accuracy_m", String(d.position.precision_m));
  f.append("capture_token", jeton);
  const r = await client.post<ReportCreated>("/reports", f, {
    timeout: 120_000, // une photo sur un petit forfait peut être lente
    onUploadProgress: (ev) => {
      if (ev.total) d.onProgression?.(Math.round((ev.loaded * 100) / ev.total));
    },
  });
  return r.data; // 201 publié (ou en modération), 200 doublon fusionné
}

/** Reproduit les vérifications du back (GPS 50 m, Cotonou, point à 100 m, doublon à 30 m) et ses réponses. */
async function creerSignalementSimule(d: NouveauSignalement): Promise<ReportCreated> {
  for (const p of [30, 70, 100]) {
    await attendre(250);
    d.onProgression?.(p);
  }
  if (MOCK_REFUS) throw erreurSimulee(MOCK_REFUS, MOCK_REFUS === "PHOTO_INVALID" ? 415 : 422);
  if (d.position.precision_m > PRECISION_MAX_M) {
    throw erreurSimulee("GPS_INACCURATE", 422, { accuracy_m: d.position.precision_m, max_m: PRECISION_MAX_M });
  }
  if (!estDansCotonou(d.position.lat, d.position.lng)) throw erreurSimulee("OUT_OF_ZONE");
  const distance = distanceM(d.position, d.point);
  if (distance > DISTANCE_MAX_M) throw erreurSimulee("TOO_FAR", 422, { distance_m: Math.round(distance) });

  const existant = mockStore.signalements.find(
    (s) => s.category === d.category && s.status !== "resolved" && distanceM(s, d.point) <= 30,
  );
  if (existant) {
    existant.support_count += 1;
    return {
      tracking_code: existant.tracking_code, status: existant.status, duplicate: true, support_count: existant.support_count,
      message: "Ce problème a déjà été signalé tout près. Votre signalement a été ajouté (+1).",
    };
  }
  const code = codeSuivi(mockStore.compteur++);
  const status: Statut = categorie(d.category).services.length ? "published" : "moderation";
  const now = new Date().toISOString();
  mockStore.signalements.unshift({
    tracking_code: code, category: d.category, category_label: categorie(d.category).libelle, status,
    description: d.description ?? "", lat: d.point.lat, lng: d.point.lng, photo_url: URL.createObjectURL(d.photo),
    photo_after_url: null, support_count: 1, created_at: now, updated_at: now, resolved_at: null,
    history: [{ from_status: "pending", to_status: status, note: "", at: now }],
    channel: d.jeton ? "whatsapp" : "web", ai_verdict: { matches_category: true, confidence: 0.9 },
  });
  return {
    tracking_code: code, status, duplicate: false, support_count: 1,
    message: status === "moderation"
      ? "Signalement reçu. Il sera examiné avant publication. Suivez-le avec ce code."
      : "Signalement publié. Suivez-le avec ce code.",
  };
}

// ---------- Espace agents (bonus front : par défaut, la mairie utilise Django admin) ----------
/** Ouvre la session via la route Next /session (même en mode simulé : la protection des routes est réelle). */
export async function connexion(identifiants: LoginRequest): Promise<Profil> {
  const r = await client.post<Profil>("/session", identifiants, { baseURL: "" });
  notifierSession();
  return r.data;
}

export async function deconnexion(): Promise<void> {
  await client.delete("/session", { baseURL: "" }).catch(() => undefined);
  notifierSession();
}

export interface FiltresAgent {
  status?: Statut;
}

/** Django ne renvoie que les catégories des services de l'agent (tout pour l'administrateur). */
export async function listerAgent(f: FiltresAgent = {}): Promise<SignalementAgent[]> {
  if (MOCKS) {
    await attendre();
    return mockStore.signalements.filter((s) => !f.status || s.status === f.status).map((s) => ({ ...s }));
  }
  const r = await client.get<AgentReportList>("/agent/reports", { params: { ...f, limit: 500 } });
  return r.data.results as SignalementAgent[];
}

function trouverSimule(code: string): SignalementAgent {
  const s = mockStore.signalements.find((x) => x.tracking_code === code);
  if (!s) throw erreurSimulee("NOT_FOUND", 404);
  return s;
}

function passerSimule(s: SignalementAgent, status: Statut, note = "") {
  const now = new Date().toISOString();
  s.history = [...s.history, { from_status: s.status, to_status: status, note, at: now }];
  s.status = status;
  s.updated_at = now;
  if (status === "resolved") s.resolved_at = now;
}

/** Transitions contrôlées par Django : published → in_progress → resolved (sinon INVALID_TRANSITION). */
export const SUIVANT: Partial<Record<Statut, StatutAgent>> = { published: "in_progress", in_progress: "resolved" };

export async function changerStatut(p: { code: string; status: StatutAgent; note?: string }): Promise<SignalementAgent> {
  if (MOCKS) {
    await attendre();
    const s = trouverSimule(p.code);
    if (SUIVANT[s.status] !== p.status) throw erreurSimulee("INVALID_TRANSITION", 409);
    passerSimule(s, p.status, p.note);
    return { ...s };
  }
  const corps = { status: p.status, note: p.note ?? "" };
  return (await client.patch<SignalementAgent>(`/agent/reports/${encodeURIComponent(p.code)}`, corps)).data;
}

/** Photo « après » : depuis in_progress (passe en resolved) ou resolved sans photo après. */
export async function ajouterPhotoApres(p: { code: string; photo: Blob; note?: string }): Promise<SignalementAgent> {
  if (MOCKS) {
    await attendre();
    const s = trouverSimule(p.code);
    if (s.status !== "in_progress" && !(s.status === "resolved" && !s.photo_after_url)) {
      throw erreurSimulee("INVALID_TRANSITION", 409);
    }
    if (s.status === "in_progress") passerSimule(s, "resolved", p.note);
    s.photo_after_url = URL.createObjectURL(p.photo);
    return { ...s };
  }
  const f = new FormData();
  f.append("photo", p.photo, "apres.jpg");
  if (p.note) f.append("note", p.note);
  const url = `/agent/reports/${encodeURIComponent(p.code)}/after-photo`;
  return (await client.post<SignalementAgent>(url, f, { timeout: 120_000 })).data;
}
