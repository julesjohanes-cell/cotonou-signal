// Design system « Cotonou Signale » : une seule source de couleurs, lisible partout.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COULEURS, OMBRES, RAYONS, variableCss } from "@/lib/jetons";
import { STATUTS } from "@/lib/categories";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

/** Déclarations `--nom: valeur;` du bloc @theme, commentaires retirés. */
function declarations(bloc: string): Map<string, string> {
  const sansCommentaires = bloc.replace(/\/\*[\s\S]*?\*\//g, "");
  const m = new Map<string, string>();
  for (const [, nom, valeur] of sansCommentaires.matchAll(/(--[a-z0-9-*]+)\s*:\s*([^;]+);/g)) m.set(nom, valeur.trim());
  return m;
}
const decl = declarations(theme);

// ---------- Contraste WCAG 2 ----------
function lineaire(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function rgbLineaire(couleur: string): [number, number, number] {
  const hex = couleur.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [lineaire((n >> 16) / 255), lineaire(((n >> 8) & 255) / 255), lineaire((n & 255) / 255)];
  }
  const ok = couleur.match(/^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/);
  if (!ok) throw new Error(`Couleur non lue : ${couleur}`);
  const [L, C, h] = [Number(ok[1]) / 100, Number(ok[2]), (Number(ok[3]) * Math.PI) / 180];
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const borne = (x: number) => Math.min(1, Math.max(0, x));
  return [
    borne(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    borne(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    borne(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
function luminance(couleur: string) {
  const [r, g, b] = rgbLineaire(couleur);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("jetons : globals.css et lib/jetons.ts disent la même chose", () => {
  it("désactive la palette Tailwind par défaut", () => {
    expect(decl.get("--color-*")).toBe("initial");
  });

  it("déclare chaque couleur de lib/jetons.ts avec la même valeur", () => {
    for (const [nom, valeur] of Object.entries(COULEURS)) {
      expect(decl.get(variableCss(nom as keyof typeof COULEURS)), nom).toBe(valeur);
    }
  });

  it("n'a aucune couleur CSS absente de lib/jetons.ts", () => {
    const attendues = new Set(Object.keys(COULEURS).map((n) => variableCss(n as keyof typeof COULEURS)));
    const enTrop = [...decl.keys()].filter((n) => n.startsWith("--color-") && n !== "--color-*" && !attendues.has(n));
    expect(enTrop).toEqual([]);
  });

  it("partage le rayon antd et l'ombre des marqueurs", () => {
    expect(decl.get("--radius-agents")).toBe(`${RAYONS.agents}px`);
    expect(decl.get("--shadow-marqueur")).toBe(OMBRES.marqueur);
  });

  it("colore les statuts avec les jetons", () => {
    expect(STATUTS.published.couleur).toBe(COULEURS.statutNouveau);
    expect(STATUTS.in_progress.couleur).toBe(COULEURS.statutPrisEnCharge);
    expect(STATUTS.resolved.couleur).toBe(COULEURS.statutResolu);
    expect(STATUTS.rejected.couleur).toBe(COULEURS.statutRejete);
  });
});

describe("jetons : contrastes (texte 4,5:1, contours et focus 3:1)", () => {
  const c = COULEURS;
  const texte: [string, string, string][] = [
    ["encre sur fond", c.encre, c.fond],
    ["encre sur teinte", c.encre, c.teinte],
    ["encre-douce sur surface", c.encreDouce, c.surface],
    ["encre-douce sur teinte", c.encreDouce, c.teinte],
    ["encre-pale sur fond", c.encrePale, c.fond],
    ["encre-pale sur teinte", c.encrePale, c.teinte],
    ["marque sur fond (titres)", c.marque, c.fond],
    ["violet sur teinte (liens)", c.violet, c.teinte],
    ["sur-marque sur marque", c.surMarque, c.marque],
    ["sur-marque sur violet", c.surMarque, c.violet],
    ["sur-marque-doux sur marque", c.surMarqueDoux, c.marque],
    ["citron sur marque", c.citron, c.marque],
    ["sur-citron sur citron", c.surCitron, c.citron],
    ["erreur sur erreur-fond", c.erreur, c.erreurFond],
    ["succes sur succes-fond", c.succes, c.succesFond],
    ["attente sur attente-fond", c.attente, c.attenteFond],
    ["neutre sur neutre-fond", c.neutre, c.neutreFond],
    ["badge Publié", c.surMarque, c.statutNouveau],
    ["badge Pris en charge", c.surMarque, c.statutPrisEnCharge],
    ["badge Résolu", c.surMarque, c.statutResolu],
    ["badge Rejeté", c.surMarque, c.statutRejete],
    ["badge En cours de vérification", c.surMarque, c.neutre],
    ["badge En modération", c.surMarque, c.violet],
    ["pastille +N", c.surMarque, c.pastilleConfirmations],
  ];
  for (const [nom, avant, fond] of texte) {
    it(`${nom} ≥ 4,5:1`, () => expect(contraste(avant, fond)).toBeGreaterThanOrEqual(4.5));
  }

  it("contour des champs et focus ≥ 3:1", () => {
    expect(contraste(c.contour, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contraste(c.focus, c.fond)).toBeGreaterThanOrEqual(3);
    expect(contraste(c.focusSurMarque, c.marque)).toBeGreaterThanOrEqual(3);
  });
});

describe("jetons : aucune couleur hors du design system dans le code", () => {
  const PALETTE =
    /\b(?:bg|text|border|ring|outline|fill|stroke|divide|placeholder|accent|decoration|caret|from|via|to|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet-\d|purple|fuchsia|pink|rose|white|black)\b/;
  const BRUTE = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i;
  const fichiers: string[] = [];
  const parcourir = (dossier: string) => {
    for (const nom of readdirSync(dossier)) {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(tsx?|css)$/.test(nom)) fichiers.push(chemin);
    }
  };
  for (const d of ["app", "components", "hooks", "lib"]) parcourir(join(process.cwd(), d));
  const sources = fichiers.filter((f) => !f.endsWith("lib/jetons.ts") && !f.endsWith("app/globals.css"));

  it("n'emploie pas la palette Tailwind par défaut (elle ne génère plus rien)", () => {
    const fautes = sources.flatMap((f) =>
      readFileSync(f, "utf8")
        .split("\n")
        .map((ligne, i) => (PALETTE.test(ligne) ? `${f.replace(process.cwd() + "/", "")}:${i + 1}` : null))
        .filter(Boolean),
    );
    expect(fautes).toEqual([]);
  });

  it("n'écrit aucune couleur brute hors de lib/jetons.ts et app/globals.css", () => {
    const fautes = sources.flatMap((f) =>
      readFileSync(f, "utf8")
        .split("\n")
        .map((ligne, i) => (BRUTE.test(ligne) ? `${f.replace(process.cwd() + "/", "")}:${i + 1}` : null))
        .filter(Boolean),
    );
    expect(fautes).toEqual([]);
  });
});
