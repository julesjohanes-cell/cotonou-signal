<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cotonou Signale : règles du projet (humains et IA)

- Interface en **français**, pensée **mobile d'abord** (écran 390 px), Tailwind uniquement.
- **Aucun `fetch` dans les composants** : tout appel passe par `lib/api.ts`. Nouveau besoin d'API → ajouter une fonction dans `lib/api.ts` (version mock + version réelle) et le type dans `lib/types.ts`.
- `lib/types.ts` = contrat avec le back Django. Ne pas le modifier sans prévenir l'équipe back.
- Cartes : toujours importer depuis `@/components/carte` (`MapView`, `PointPicker`), jamais `maplibre-gl` directement dans une page.
- Catégories, services, statuts : uniquement depuis `lib/categories.ts`.
- **Vie privée** : aucune page publique (`/carte`, `/suivi`) n'affiche le téléphone, le nom ou la position GPS du citoyen. Seul le point du problème est public.
- On signale des **lieux, jamais des personnes**.
- Chaque équipe reste dans ses dossiers (voir README) pour éviter les conflits Git. Les fichiers partagés (`lib/`, `components/carte`, `components/ui.tsx`) ne se modifient qu'avec l'accord du mentor front.
- Composants interactifs : `"use client"` en tête de fichier. Paramètres de route via `useParams()`.
- Avant de pousser : `npm run build` doit passer.
