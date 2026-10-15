// Client API unique. Les composants n'appellent JAMAIS fetch directement : tout passe par ici.
import type {
  CategorieCode, CreationReponse, ErreurApi, LienWhatsApp, Session,
  SignalementMairie, SignalementPublic, Statut,
} from "./types";
import { mockStore, attendre } from "./mocks";
import { categorie } from "./categories";
import { distanceM, estDansCotonou, type Position } from "./geo";

export const MOCKS = process.env.NEXT_PUBLIC_MOCKS !== "0";
const MOCK_REFUS = process.env.NEXT_PUBLIC_MOCK_REFUS; // ex. "photo_hors_sujet" pour tester l'écran de refus

export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 0) {
    super(message);
  }
}

// ---------- Session mairie (token DRF) ----------
const CLE_SESSION = "cs_session";
export function lireSession(): Session | null {
  try {
    const s = localStorage.getItem(CLE_SESSION);
    return s ? (JSON.parse(s) as Session) : null;
  } catch {
    return null;
  }
}
function ecrireSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s));
    else localStorage.removeItem(CLE_SESSION);
  } catch {}
}
export const deconnexion = () => ecrireSession(null);

// ---------- fetch ----------
async function appel<T>(chemin: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (auth) {
    const s = lireSession();
    if (s) headers.set("Authorization", `Token ${s.token}`);
  }
  let rep: Response;
  try {
    rep = await fetch(`/api${chemin}`, { ...init, headers });
  } catch {
    throw new ApiError("reseau", "Connexion impossible. Vérifie ta connexion internet.");
  }
  if (!rep.ok) {
    let err: Partial<ErreurApi> = {};
    try {
      err = await rep.json();
    } catch {}
    if (rep.status === 401) ecrireSession(null);
    throw new ApiError(err.code ?? `http_${rep.status}`, err.message ?? `Erreur serveur (${rep.status})`, rep.status);
  }
  if (rep.status === 204) return undefined as T;
  return rep.json() as Promise<T>;
}

const versPublic = (s: SignalementMairie): SignalementPublic => ({
  numero_suivi: s.numero_suivi, categorie: s.categorie, statut: s.statut, lat: s.lat, lng: s.lng,
  nb_confirmations: s.nb_confirmations, photo_url: s.photo_url, photo_apres_url: s.photo_apres_url,
  cree_le: s.cree_le, mis_a_jour_le: s.mis_a_jour_le,
});

// ---------- Public ----------
export async function listerPublic(): Promise<SignalementPublic[]> {
  if (MOCKS) {
    await attendre();
    return mockStore.signalements.filter((s) => s.statut !== "rejete").map(versPublic);
  }
  return appel("/signalements/public");
}

export async function suivre(numero: string): Promise<SignalementPublic> {
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.numero_suivi === numero.trim().toUpperCase());
    if (!s) throw new ApiError("introuvable", "Aucun signalement avec ce numéro.", 404);
    return versPublic(s);
  }
  return appel(`/signalements/${encodeURIComponent(numero.trim())}`);
}

export interface NouveauSignalement {
  categorie: CategorieCode;
  photo: Blob;
  photo_prise_le: number; // timestamp ms
  gps: Position; // position du citoyen (jamais publique)
  point: { lat: number; lng: number }; // point du problème, ajusté sur la carte
  description?: string;
  token?: string; // parcours WhatsApp
}

export async function creerSignalement(d: NouveauSignalement): Promise<CreationReponse> {
  if (MOCKS) {
    await attendre(900);
    if (MOCK_REFUS) throw new ApiError(MOCK_REFUS, messageRefus(MOCK_REFUS), 422);
    if (!estDansCotonou(d.gps.lat, d.gps.lng)) throw new ApiError("hors_cotonou", messageRefus("hors_cotonou"), 422);
    if (distanceM(d.gps, d.point) > 100) throw new ApiError("trop_loin", messageRefus("trop_loin"), 422);
    const existant = mockStore.signalements.find(
      (s) => s.categorie === d.categorie && s.statut !== "resolu" && distanceM(s, d.point) < 30,
    );
    if (existant) {
      existant.nb_confirmations += 1;
      return { numero_suivi: existant.numero_suivi, statut: existant.statut, doublon: true };
    }
    const numero = `CS-2026-${String(mockStore.compteur++).padStart(5, "0")}`;
    const now = new Date().toISOString();
    mockStore.signalements.unshift({
      numero_suivi: numero, categorie: d.categorie, statut: "nouveau", lat: d.point.lat, lng: d.point.lng,
      nb_confirmations: 1, photo_url: URL.createObjectURL(d.photo), photo_apres_url: null,
      cree_le: now, mis_a_jour_le: now, service: categorie(d.categorie).service,
      source: d.token ? "whatsapp" : "web", precision_m: Math.round(d.gps.precision_m),
      description: d.description ?? null,
    });
    return { numero_suivi: numero, statut: "nouveau", doublon: false };
  }
  const f = new FormData();
  f.append("categorie", d.categorie);
  f.append("photo", d.photo, "photo.jpg");
  f.append("photo_prise_le", new Date(d.photo_prise_le).toISOString());
  f.append("lat_gps", String(d.gps.lat));
  f.append("lng_gps", String(d.gps.lng));
  f.append("precision_m", String(Math.round(d.gps.precision_m)));
  f.append("lat", String(d.point.lat));
  f.append("lng", String(d.point.lng));
  if (d.description) f.append("description", d.description);
  if (d.token) f.append("token", d.token);
  return appel("/signalements", { method: "POST", body: f });
}

// ---------- WhatsApp ----------
export async function verifierLien(token: string): Promise<LienWhatsApp> {
  if (MOCKS) {
    await attendre();
    if (token === "expire") return { valide: false, raison: "expire" };
    if (token === "utilise") return { valide: false, raison: "utilise" };
    return { valide: true, expire_a: new Date(Date.now() + 10 * 60000).toISOString() };
  }
  return appel(`/wa/${encodeURIComponent(token)}`);
}

// ---------- Mairie ----------
export async function connexion(identifiant: string, motDePasse: string): Promise<Session> {
  let s: Session;
  if (MOCKS) {
    await attendre();
    s = { token: "mock", nom: identifiant || "agent", role: identifiant === "elu" ? "elu" : "agent", service: null };
  } else {
    s = await appel<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: identifiant, password: motDePasse }),
    });
  }
  ecrireSession(s);
  return s;
}

export async function listerMairie(f: { statut?: Statut; service?: string } = {}): Promise<SignalementMairie[]> {
  if (MOCKS) {
    await attendre();
    return mockStore.signalements.filter(
      (s) => (!f.statut || s.statut === f.statut) && (!f.service || s.service === f.service),
    );
  }
  const q = new URLSearchParams();
  if (f.statut) q.set("statut", f.statut);
  if (f.service) q.set("service", f.service);
  return appel(`/mairie/signalements${q.size ? `?${q}` : ""}`, {}, true);
}

export async function changerStatut(numero: string, statut: Statut): Promise<SignalementMairie> {
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.numero_suivi === numero)!;
    s.statut = statut;
    s.mis_a_jour_le = new Date().toISOString();
    return { ...s };
  }
  return appel(`/mairie/signalements/${numero}`, { method: "PATCH", body: JSON.stringify({ statut }) }, true);
}

export async function ajouterPhotoApres(numero: string, photo: Blob): Promise<SignalementMairie> {
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.numero_suivi === numero)!;
    s.photo_apres_url = URL.createObjectURL(photo);
    s.mis_a_jour_le = new Date().toISOString();
    return { ...s };
  }
  const f = new FormData();
  f.append("photo", photo, "apres.jpg");
  return appel(`/mairie/signalements/${numero}/photo-apres`, { method: "POST", body: f }, true);
}

// ---------- Messages de refus (affichés tels quels au citoyen) ----------
export function messageRefus(code: string, defaut?: string): string {
  const m: Record<string, string> = {
    photo_hors_sujet: "La photo ne montre pas le problème choisi. Reprends une photo bien cadrée.",
    capture_ecran: "Les captures d'écran ne sont pas acceptées. Prends la photo sur place.",
    photo_ancienne: "La photo doit être prise à l'instant, pas depuis la galerie.",
    hors_cotonou: "Ta position est en dehors de Cotonou.",
    trop_loin: "Le point doit être à moins de 100 m de ta position.",
    precision_insuffisante: "Position GPS pas assez précise. Sors à découvert et réessaie.",
    lien_expire: "Ce lien a expiré. Écris « Signaler » à nouveau sur WhatsApp.",
    lien_utilise: "Ce lien a déjà servi. Écris « Signaler » à nouveau sur WhatsApp.",
    reseau: "Connexion impossible. Vérifie ta connexion internet.",
  };
  return m[code] ?? defaut ?? "Une erreur est survenue. Réessaie.";
}
