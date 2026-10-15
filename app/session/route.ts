// Ouverture et fermeture de session agent (espace mairie, bonus).
// POST /session   { username, password } → appelle POST /api/v1/auth/login de Django,
//                 pose le cookie httpOnly du jeton + le cookie de profil (identifiant, services)
// DELETE /session → efface les deux cookies
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_JETON, COOKIE_PROFIL, DUREE_SESSION_S, corpsErreur, validerIdentifiants } from "@/lib/securite";
import type { CorpsErreur, LoginResult, Profil } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const MOCKS = process.env.NEXT_PUBLIC_MOCKS !== "0";
const REFUS = "Identifiant ou mot de passe invalide.";

function optionsCookie(req: NextRequest, httpOnly: boolean) {
  const https = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  return { httpOnly, secure: https, sameSite: "strict" as const, path: "/", maxAge: DUREE_SESSION_S };
}

export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(corpsErreur("INVALID_INPUT", "Format de requête refusé."), { status: 415 });
  }
  const ids = validerIdentifiants(await req.json().catch(() => null), !MOCKS);
  if (!ids) return NextResponse.json(corpsErreur("INVALID_INPUT", REFUS), { status: 400 });

  let session: LoginResult;
  if (MOCKS) {
    session = { token: crypto.randomUUID(), user: { username: ids.username, services: [] } };
  } else {
    const rep = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(ids),
    }).catch(() => null);
    if (!rep) return NextResponse.json(corpsErreur("NETWORK", "Serveur indisponible."), { status: 502 });
    if (rep.status === 429) {
      const corps = (await rep.json().catch(() => null)) as CorpsErreur | null;
      return NextResponse.json(corpsErreur("RATE_LIMITED", corps?.error?.message ?? "Trop de tentatives. Réessayez dans un instant."), { status: 429 });
    }
    // Même message pour « inconnu » et « mauvais mot de passe » : on ne révèle pas quels comptes existent
    if (!rep.ok) return NextResponse.json(corpsErreur("UNAUTHENTICATED", REFUS), { status: 401 });
    session = (await rep.json()) as LoginResult;
  }

  const profil: Profil = { username: session.user.username, services: session.user.services };
  const reponse = NextResponse.json(profil);
  reponse.cookies.set(COOKIE_JETON, session.token, optionsCookie(req, true));
  reponse.cookies.set(COOKIE_PROFIL, Buffer.from(JSON.stringify(profil)).toString("base64url"), optionsCookie(req, false));
  return reponse;
}

export async function DELETE() {
  const reponse = NextResponse.json({ ok: true });
  reponse.cookies.delete(COOKIE_JETON);
  reponse.cookies.delete(COOKIE_PROFIL);
  return reponse;
}
