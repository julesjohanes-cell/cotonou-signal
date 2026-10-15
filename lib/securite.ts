// Règles de sécurité partagées entre proxy.ts, la route /session et l'interface.
// Aucun import navigateur ici : ce fichier tourne aussi côté serveur.
import type { CorpsErreur, LoginRequest } from "./types";

/** Cookie httpOnly qui porte le jeton DRF : jamais lisible par le JavaScript de la page (protège du vol par XSS). */
export const COOKIE_JETON = "cs_jeton";
/** Cookie lisible qui ne contient que le profil affiché (identifiant, services) : aucun secret dedans. */
export const COOKIE_PROFIL = "cs_profil";
/** Durée d'une session agent : une journée de travail. */
export const DUREE_SESSION_S = 8 * 60 * 60;

/** Pages protégées : redirigées vers /connexion sans session. */
export const PAGES_PROTEGEES = ["/mairie"];
/** API protégées (contrat : /agent/*) : 401 sans session ; avec session, le proxy ajoute le jeton. */
export const API_PROTEGEES = ["/api/v1/agent"];

/** Erreurs des routes Next (/session, proxy.ts) : même forme que celles de Django. */
export function corpsErreur(code: string, message: string): CorpsErreur {
  return { error: { code, message, details: {} } };
}

/**
 * Destination après connexion : uniquement un chemin interne.
 * Refuse « //site.com », « /\site.com » ou une URL complète (redirection ouverte).
 */
export function suiteSure(suite: string | null | undefined, defaut = "/mairie"): string {
  if (!suite || !suite.startsWith("/") || suite.startsWith("//") || suite.startsWith("/\\")) return defaut;
  return suite;
}

/** Les requêtes qui modifient des données doivent venir de notre propre origine (anti-CSRF, en plus de SameSite=Strict). */
export function origineAutorisee(origine: string | null, hoteAttendu: string | null): boolean {
  if (!origine) return true; // navigateurs anciens ou appel même origine sans en-tête Origin
  if (!hoteAttendu) return false;
  try {
    return new URL(origine).host === hoteAttendu;
  } catch {
    return false;
  }
}

/** Validation stricte des identifiants reçus par /session (types, longueurs), au format de POST /auth/login. */
export function validerIdentifiants(corps: unknown, motDePasseRequis: boolean): LoginRequest | null {
  if (!corps || typeof corps !== "object") return null;
  const { username, password } = corps as Record<string, unknown>;
  if (typeof username !== "string" || username.trim().length < 1 || username.length > 150) return null;
  if (typeof password !== "string" || password.length > 256) return null;
  if (motDePasseRequis && password.length < 1) return null;
  return { username: username.trim(), password };
}
