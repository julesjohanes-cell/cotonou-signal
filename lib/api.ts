// Couche réseau unique (axios). Les écrans n'appellent jamais ce fichier directement :
// ils passent par les hooks TanStack Query de hooks/useSignalements.ts.
import axios, { type AxiosError } from "axios";
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
const EVT_SESSION = "cs-session";

export function lireSession(): Session | null {
  const brut = lireSessionBrute();
  return brut ? (JSON.parse(brut) as Session) : null;
}
/** Chaîne brute (stable entre deux rendus) pour useSyncExternalStore. */
export function lireSessionBrute(): string | null {
  try {
    return localStorage.getItem(CLE_SESSION);
  } catch {
    return null;
  }
}
export function abonnerSession(rappel: () => void): () => void {
  window.addEventListener(EVT_SESSION, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVT_SESSION, rappel);
    window.removeEventListener("storage", rappel);
  };
}
function ecrireSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s));
    else localStorage.removeItem(CLE_SESSION);
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT_SESSION));
}
export const deconnexion = () => ecrireSession(null);

// ---------- Client axios ----------
// Même origine : Next relaie /api vers Django (next.config.ts), donc pas de CORS.
const client = axios.create({ baseURL: "/api", timeout: 30_000, headers: { Accept: "application/json" } });

client.interceptors.request.use((config) => {
  const s = typeof window !== "undefined" ? lireSession() : null;
  if (s) config.headers.set("Authorization", `Token ${s.token}`);
  return config;
});

// Toute erreur devient une ApiError { code, message, status } : les écrans n'ont qu'un format à gérer
client.interceptors.response.use(
  (r) => r,
  (e: AxiosError<Partial<ErreurApi>>) => {
    if (!e.response) {
      const code = e.code === "ECONNABORTED" ? "delai" : "reseau";
      return Promise.reject(new ApiError(code, messageRefus(code)));
    }
    if (e.response.status === 401) ecrireSession(null);
    const d = e.response.data ?? {};
    return Promise.reject(
      new ApiError(d.code ?? `http_${e.response.status}`, d.message ?? `Erreur serveur (${e.response.status})`, e.response.status),
    );
  },
);

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
  return (await client.get<SignalementPublic[]>("/signalements/public")).data;
}

export async function suivre(numero: string): Promise<SignalementPublic> {
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.numero_suivi === numero.trim().toUpperCase());
    if (!s) throw new ApiError("introuvable", "Aucun signalement avec ce numéro.", 404);
    return versPublic(s);
  }
  return (await client.get<SignalementPublic>(`/signalements/${encodeURIComponent(numero.trim())}`)).data;
}

export interface NouveauSignalement {
  categorie: CategorieCode;
  photo: Blob;
  photo_prise_le: number; // timestamp ms
  gps: Position; // position du citoyen (jamais publique)
  point: { lat: number; lng: number }; // point du problème, ajusté sur la carte
  description?: string;
  token?: string; // parcours WhatsApp
  onProgression?: (pourcentage: number) => void; // envoi de la photo (réseau lent)
}

export async function creerSignalement(d: NouveauSignalement): Promise<CreationReponse> {
  if (MOCKS) {
    for (const p of [30, 70, 100]) {
      await attendre(250);
      d.onProgression?.(p);
    }
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
  const r = await client.post<CreationReponse>("/signalements", f, {
    timeout: 120_000, // une photo sur un petit forfait peut être lente
    onUploadProgress: (ev) => {
      if (ev.total) d.onProgression?.(Math.round((ev.loaded * 100) / ev.total));
    },
  });
  return r.data;
}

// ---------- WhatsApp ----------
export async function verifierLien(token: string): Promise<LienWhatsApp> {
  if (MOCKS) {
    await attendre();
    if (token === "expire") return { valide: false, raison: "expire" };
    if (token === "utilise") return { valide: false, raison: "utilise" };
    return { valide: true, expire_a: new Date(Date.now() + 10 * 60000).toISOString() };
  }
  return (await client.get<LienWhatsApp>(`/wa/${encodeURIComponent(token)}`)).data;
}

// ---------- Mairie (bonus front : par défaut, la mairie utilise Django admin) ----------
export async function connexion(identifiant: string, motDePasse: string): Promise<Session> {
  let s: Session;
  if (MOCKS) {
    await attendre();
    s = { token: "mock", nom: identifiant || "agent", role: identifiant === "elu" ? "elu" : "agent", service: null };
  } else {
    s = (await client.post<Session>("/auth/login", { username: identifiant, password: motDePasse })).data;
  }
  ecrireSession(s);
  return s;
}

export interface FiltresMairie {
  statut?: Statut;
  service?: string;
}

export async function listerMairie(f: FiltresMairie = {}): Promise<SignalementMairie[]> {
  if (MOCKS) {
    await attendre();
    return mockStore.signalements
      .filter((s) => (!f.statut || s.statut === f.statut) && (!f.service || s.service === f.service))
      .map((s) => ({ ...s }));
  }
  return (await client.get<SignalementMairie[]>("/mairie/signalements", { params: f })).data;
}

export async function changerStatut({ numero, statut }: { numero: string; statut: Statut }): Promise<SignalementMairie> {
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.numero_suivi === numero)!;
    s.statut = statut;
    s.mis_a_jour_le = new Date().toISOString();
    return { ...s };
  }
  return (await client.patch<SignalementMairie>(`/mairie/signalements/${numero}`, { statut })).data;
}

export async function ajouterPhotoApres({ numero, photo }: { numero: string; photo: Blob }): Promise<SignalementMairie> {
  if (MOCKS) {
    await attendre();
    const s = mockStore.signalements.find((x) => x.numero_suivi === numero)!;
    s.photo_apres_url = URL.createObjectURL(photo);
    s.mis_a_jour_le = new Date().toISOString();
    return { ...s };
  }
  const f = new FormData();
  f.append("photo", photo, "apres.jpg");
  return (await client.post<SignalementMairie>(`/mairie/signalements/${numero}/photo-apres`, f)).data;
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
    delai: "Le réseau est trop lent. Réessaie dans un instant.",
  };
  return m[code] ?? defaut ?? "Une erreur est survenue. Réessaie.";
}
