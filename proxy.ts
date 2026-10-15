// Protection des routes (Next 16 : « proxy », ex-middleware). S'exécute côté serveur AVANT les pages
// et AVANT le relais /api de next.config.ts.
// - /mairie/*      : sans session → redirection vers /connexion
// - /api/v1/agent/* : sans session → 401 ; avec session → relayé à Django avec « Authorization: Token … »
//   Le jeton reste dans un cookie httpOnly : le JavaScript de la page ne le voit jamais.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_JETON, corpsErreur, origineAutorisee } from "@/lib/securite";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const METHODES_SURES = ["GET", "HEAD", "OPTIONS"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const estApi = pathname.startsWith("/api/");
  const jeton = req.cookies.get(COOKIE_JETON)?.value;

  if (estApi && !METHODES_SURES.includes(req.method)) {
    const hote = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origineAutorisee(req.headers.get("origin"), hote)) {
      return NextResponse.json(corpsErreur("FORBIDDEN", "Requête refusée."), { status: 403 });
    }
  }

  if (!jeton) {
    if (estApi) {
      return NextResponse.json(corpsErreur("UNAUTHENTICATED", "Connexion requise."), { status: 401 });
    }
    const connexion = new URL("/connexion", req.url);
    connexion.searchParams.set("suite", pathname);
    return NextResponse.redirect(connexion);
  }

  if (estApi) {
    const entetes = new Headers(req.headers);
    entetes.set("Authorization", `Token ${jeton}`);
    entetes.delete("cookie"); // les cookies du front ne partent pas vers Django
    return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL), { request: { headers: entetes } });
  }

  return NextResponse.next();
}

export const config = {
  // Toujours identique à PAGES_PROTEGEES et API_PROTEGEES (lib/securite.ts)
  matcher: ["/mairie/:path*", "/api/v1/agent/:path*"],
};
