// Un seul fichier d'instructions pour tous les agents IA : AGENTS.md (format ouvert agents.md, interopérable).
// Ce contrôle refuse les fichiers propres à un fournisseur : des règles en double finissent toujours par diverger.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const INTERDITS = [
  "claude.md", "gemini.md", "chatgpt.md", "codex.md", "copilot.md", "cursor.md",
  ".cursorrules", ".windsurfrules", ".clinerules",
  ".cursor/", ".claude/", ".gemini/", ".codex/",
  ".github/copilot-instructions.md", ".github/instructions/",
];

let suivis;
try {
  suivis = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
} catch {
  suivis = null; // pas de dépôt git : on vérifie seulement les fichiers présents
}

const estInterdit = (chemin) => {
  const c = chemin.toLowerCase();
  return INTERDITS.some((i) => (i.endsWith("/") ? c.startsWith(i) : c === i));
};
const trouves = suivis
  ? suivis.filter(estInterdit)
  : INTERDITS.filter((i) => !i.endsWith("/") && existsSync(i));

if (!existsSync("AGENTS.md")) {
  console.error("AGENTS.md est manquant : c'est la source unique des règles des agents.");
  process.exit(1);
}
if (trouves.length > 0) {
  console.error(`Fichiers d'instructions propres à un outil interdits : ${trouves.join(", ")}`);
  console.error("Mettre ces règles dans AGENTS.md : un seul fichier pour tous les agents.");
  process.exit(1);
}
console.log("Instructions des agents : AGENTS.md uniquement.");
