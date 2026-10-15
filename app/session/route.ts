// Ouverture et fermeture de session agent (espace mairie, bonus).
// POST /session   { identifiant, motDePasse } → pose le cookie httpOnly du jeton + le cookie de profil
// DELETE /session → efface les deux cookies
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_JETON, COOKIE_PROFIL, DUREE_SESSION_S, validerIdentifiants } from "@/lib/securite";
import type { Session } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const MOCKS = process.env.NEXT_PUBLIC_MOCKS !== "0";

function optionsCookie(req: NextRequest, httpOnly: boolean) {
  const https = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  return { httpOnly, secure: https, sameSite: "strict" as const, path: "/", maxAge: DUREE_SESSION_S };
}

export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ code: "format", message: "Format de requête refusé." }, { status: 415 });
  }
  const ids = validerIdentifiants(await req.json().catch(() => null), !MOCKS);
  if (!ids) {
    return NextResponse.json({ code: "identifiants_invalides", message: "Identifiant ou mot de passe invalide." }, { status: 400 });
  }

  let session: Session;
  if (MOCKS) {
    const role = ids.identifiant === "elu" ? "elu" : "agent";
    session = { token: crypto.randomUUID(), nom: ids.identifiant, role, service: null };
  } else {
    const rep = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ids.identifiant, password: ids.motDePasse }),
    }).catch(() => null);
    if (!rep) return NextResponse.json({ code: "reseau", message: "Serveur indisponible." }, { status: 502 });
    // Même message pour « inconnu » et « mauvais mot de passe » : on ne révèle pas quels comptes existent
    if (!rep.ok) {
      return NextResponse.json({ code: "identifiants_invalides", message: "Identifiant ou mot de passe invalide." }, { status: 401 });
    }
    session = (await rep.json()) as Session;
  }

  const profil = { nom: session.nom, role: session.role, service: session.service };
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
