# Cotonou Signale — front Next.js

Des signalements citoyens vérifiés, pour une ville plus propre. Cotonou Code la nuit, 15 octobre 2026.

## Démarrer (2 min)

Dépôt : https://github.com/julesjohanes-cell/cotonou-signal

```bash
git clone https://github.com/julesjohanes-cell/cotonou-signal.git
cd cotonou-signal
corepack enable            # active pnpm (fourni avec Node 22)
pnpm install
cp .env.example .env.local
pnpm dev                   # http://localhost:3000
```

Par défaut, l'app tourne sur des **données simulées** (badge MOCKS en haut à droite) : pas besoin d'attendre Django.
Les données simulées ont exactement la forme du contrat d'API. Pour brancher le vrai back (dépôt `cotonou-signal-back`,
`docker compose up`) : `NEXT_PUBLIC_MOCKS=0` et `BACKEND_URL=http://localhost:8000` dans `.env.local`, puis relancer `pnpm dev`.
Comptes de démo du back : `agent.assainissement` (ou `agent.dechets`, `agent.techniques`…) / `agent1234`.

## Mobile d'abord (obligatoire)

Chaque écran est conçu et testé d'abord pour un téléphone de **360 px** de large : cibles tactiles de 44 px, action principale en bas
de l'écran, champs en 16 px, hauteurs en `dvh`, aucun défilement horizontal. Ant Design n'est chargé que dans `app/(agents)/` :
les pages citoyennes restent légères. `tests/e2e/mobile.spec.ts` vérifie tout cela à chaque PR. Détails : `AGENTS.md`, section 3.

## Design system

Les couleurs viennent du design system « Cotonou Signale » (brief Cotonou Code la nuit), qui sert aussi aux maquettes Claude Design.
Elles sont déclarées une seule fois dans le `@theme` de `app/globals.css` (`bg-marque`, `text-encre-douce`, `border-filet`…),
avec leur miroir `lib/jetons.ts` pour antd et la carte. La palette Tailwind par défaut est désactivée ;
`tests/unit/jetons.test.ts` vérifie les deux fichiers, les contrastes et l'absence de toute autre couleur.

## Tests et vérification

```bash
pnpm test          # tests unitaires et de composants (Vitest + Testing Library), dans tests/unit
pnpm verify        # lint + types + tests + build : obligatoire avant chaque PR
pnpm test:e2e      # parcours de bout en bout (Playwright), après un build
```

Chaque fonctionnalité arrive avec ses tests. Règles complètes pour les humains et les agents IA : `AGENTS.md`,
**un seul fichier pour tous les outils** (Claude, ChatGPT/Codex, Gemini, Copilot, Cursor…) ; aucun `CLAUDE.md`, `GEMINI.md`
ou équivalent (`pnpm check:agents` les refuse). Si un outil ne le lit pas tout seul : « Lis AGENTS.md et applique-le ».
Résultats de l'atelier design thinking (personas, parcours testés, priorités) : `docs/design-thinking.md`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`), environ 1 minute : sur chaque PR et chaque fusion, deux jobs tournent en parallèle.
  **« Vérifications »** : installation figée, audit, règles des agents, puis lint, types et tests unitaires lancés en même temps.
  **« Build et e2e »** : build de production (cache `.next/cache` réutilisé, types non revérifiés), puis parcours Playwright
  en parallèle sur le Chrome déjà installé du runner (aucun navigateur à télécharger).
  Le contrôle **« Qualité »** n'est vert que si les deux le sont. Une PR rouge ne se fusionne pas.
- **Protection de `main`** (à régler une fois dans GitHub › Settings › Branches) : PR obligatoire, contrôle « Qualité » requis,
  une relecture, pas de push direct.
- **CD** : sur la machine de démo, `pnpm demo:cd` suit `origin/main` (vérification toutes les 15 s) ; une fusion est en ligne
  en moins de 30 s. Le rebuild se fait dans `.next` pendant que le serveur tourne sur une copie (`.next-live`), puis bascule
  (coupure d'une demi-seconde environ). `pnpm install` ne tourne que si les dépendances changent ; aucun rebuild si seuls la doc,
  les tests ou la CI changent. Si le build échoue, l'ancienne version reste en ligne. Le tunnel Cloudflare pointe sur ce serveur
  (port 3000, ou `PORT=…`). Garder le script actif en continu (dans `tmux`, par exemple).

## Sécurité et routes protégées

| Route | Accès | Protection |
|---|---|---|
| `/`, `/signaler`, `/capture/[token]`, `/carte`, `/suivi/*` | Public | Aucune donnée personnelle affichée ; `/capture/*` en `no-referrer`, non indexé |
| `/mairie/*` (bonus) | Agents | `proxy.ts` : sans session → `/connexion` |
| `/api/v1/agent/*` | Agents | `proxy.ts` : sans session → 401 ; sinon relais vers Django avec `Authorization: Token …` |
| `/session` | Connexion | Pose le cookie httpOnly `cs_jeton` (SameSite=Strict) ; le jeton n'est jamais lisible en JavaScript |
| Django admin | Staff | Géré par le back |

En-têtes posés sur toutes les pages (`next.config.ts`) : CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Permissions-Policy` (caméra et position pour notre origine seulement), HSTS. Règles complètes : `AGENTS.md`, section 9.

Déjà en place côté back : jeton par service (un agent ne voit que ses catégories), limitation de débit (60/min sur
`POST /reports`, 30/min sur `POST /capture-sessions`, 10/min sur la connexion), liens de capture à usage unique de 10 min,
réponses publiques sans position du citoyen ni verdict IA. Encore à faire côté back (équipes 4 et 5) : contrôles photo, GPS,
zone, photo déjà vue, modèle de vision et doublons (`reports/checks.py`, `verification/`), EXIF retirées, floutage,
`DEBUG=False` et `SECRET_KEY` hors du dépôt pour la démo.

## Tester sur un téléphone (obligatoire pour caméra + GPS)

Le navigateur refuse la caméra et le GPS en `http://192.168…`. Il faut du **HTTPS** :

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Ouvre l'URL `https://….trycloudflare.com` sur le téléphone. Next relaie `/api/*` et `/media/*` vers Django :
une seule URL, **pas de CORS** à configurer côté Django.

## Les packages et pourquoi

| Package | Pourquoi |
|---|---|
| `next` 16, `react` 19, TypeScript | App Router, pages, relais `/api` vers Django ; types stricts partout |
| `@tanstack/react-query` | Cache, chargement et erreurs gérés, rafraîchissement auto de la carte, nouvelle tentative sur réseau instable, invalidation après un signalement |
| `axios` | Un seul client HTTP : intercepteurs (jeton, erreurs 422 → `ApiError`), délai, **progression de l'envoi de la photo** |
| `antd`, `@ant-design/nextjs-registry`, `@ant-design/icons` | Composants accessibles en français (formulaires, tableaux, messages), thème aux couleurs du brief, styles rendus côté serveur |
| `tailwindcss` 4 | Mise en page mobile rapide, jetons du design system (`@theme` de `app/globals.css`) |
| `dayjs` | Dates en français (« il y a 3 jours ») ; c'est aussi la bibliothèque de dates d'antd |
| `maplibre-gl` | Carte vectorielle libre (OpenStreetMap), sans clé ni quota |
| `vitest`, `@testing-library/react`, `jsdom` | Tests unitaires et de composants, rapides |
| `@playwright/test` | Parcours de bout en bout sur un téléphone émulé, en CI |
| `swagger-typescript-api` | `pnpm api:generate` : types TypeScript générés depuis le contrat `contrat/openapi.yaml` (jamais retapés à la main) |
| `eslint` (config Next) | Règles React et Next, dont celles du compilateur React |
| pnpm | Installations rapides, lockfile strict, mêmes versions pour tous et en CI |

## Pages et équipes

| Équipe | Pages | Fichiers |
|---|---|---|
| **Capture** | `/signaler` | `app/signaler`, `components/signalement`, `components/CameraCapture.tsx`, `hooks/useGeolocalisation.ts` |
| **WhatsApp + suivi** | `/capture/[token]`, `/suivi`, `/suivi/[numero]` | `app/capture`, `app/suivi` |
| **Carte** | `/carte` | `app/carte` |
| **Bonus** | `/mairie`, `/connexion` (Ant Design) | `app/(agents)/` — seulement si tous les P0 sont livrés ; sinon la mairie utilise **Django admin** |
| **Mentor front** | fichiers partagés, contrat, CI/CD, sécurité | `contrat/`, `proxy.ts`, `lib/`, `hooks/useSignalements.ts`, `components/carte`, `components/ui.tsx`, `components/*Provider.tsx`, `.github/` |

Raccourcis en mode simulé : `/capture/expire`, `/capture/utilise` et `/capture/inconnu` (liens invalides),
`/capture/lien-valide` (parcours WhatsApp), n'importe quel identifiant sur `/connexion`,
`NEXT_PUBLIC_MOCK_REFUS=PHOTO_MISMATCH` (ou un autre code du contrat) pour afficher un refus.

## Organisation GitHub

- Une branche par équipe : `front/capture`, `front/whatsapp`, `front/carte`.
- Une PR par ticket (issue), toutes les 20 à 30 min, avec le modèle `.github/pull_request_template.md`.
- Issues avec labels d'équipe et `P0` / `P1`, suivies dans un tableau GitHub Projects.

## Contrat d'API avec Django

Source de vérité : **`contrat/openapi.yaml`**, copie de `docs/openapi.yaml` du dépôt back (avec `contrat/api-contract.md`,
la version lisible). Gelé à 20h20 : ensuite, on ajoute (champ facultatif, endpoint), on ne renomme ni ne supprime rien.

- Types TypeScript générés dans `lib/generated/` (`pnpm api:generate`), ré-exportés ou dérivés dans `lib/types.ts`. Jamais retapés.
- Le back a changé le contrat ? `pnpm api:sync` (recopie depuis `../cotonou-signal-back`, ou `BACK_DIR=…`), puis adapter le front
  dans la même PR. La CI vérifie que `lib/generated/` correspond bien à `contrat/openapi.yaml` (`pnpm api:check`).
- Conventions : préfixe `/api/v1`, snake_case, dates ISO, barre oblique finale facultative.
- **GeoJSON = `[longitude, latitude]`** : la conversion se fait uniquement dans `depuisGeoJSON` (`lib/geo.ts`).
- Toute erreur : `{"error": {"code", "message", "details"}}`. L'écran affiche `message` (en français), la logique se base sur `code`.

| Méthode | Route (`/api/v1/…`) | Utilisé par | Corps / réponse |
|---|---|---|---|
| POST | `/capture-sessions` | `/signaler` (juste avant l'envoi) | → 201 `{ token, expires_at, capture_url }` |
| GET | `/capture-sessions/{token}` | `/capture/[token]` | → 200 `{ valid, expires_at }`, ou 404 / 409 `TOKEN_USED` / 410 `TOKEN_EXPIRED` |
| POST | `/reports` | parcours de signalement | multipart `category`, `description?`, `photo`, `point_lat`, `point_lng`, `device_lat`, `device_lng`, `device_accuracy_m`, `capture_token` → 201 `{ tracking_code, status, duplicate, support_count, message }`, 200 si doublon fusionné, 422 si refus |
| GET | `/reports` | `/carte` | GeoJSON des signalements publics (aucune donnée perso) |
| GET | `/reports/{tracking_code}` | `/suivi/[numero]` | détail + `history[]` (la note de l'agent est visible, jamais son nom) |
| GET | `/categories` | (liste aussi dans `lib/categories.ts`) | `[{ slug, label, services[], needs_moderation }]` |

Bonus (espace mairie en front ; le jeton reste dans le cookie httpOnly, `proxy.ts` ajoute `Authorization: Token …`) :

| Méthode | Route | Corps / réponse |
|---|---|---|
| POST | `/session` (route Next) → `/api/v1/auth/login` | `{ username, password }` → profil `{ username, services }` |
| GET | `/api/v1/agent/reports?status=` | `{ count, results[] }` : signalements des services de l'agent, avec `channel` et `ai_verdict` |
| PATCH | `/api/v1/agent/reports/{code}` | `{ status: "in_progress" \| "resolved", note }` ; transitions `published → in_progress → resolved` |
| POST | `/api/v1/agent/reports/{code}/after-photo` | multipart `photo`, `note` → passe en `resolved` |

Codes de refus (422) : `OUT_OF_ZONE`, `TOO_FAR`, `GPS_INACCURATE`, `PHOTO_REUSED`, `PHOTO_MISMATCH`, `PHOTO_SCREENSHOT`
(et `PHOTO_INVALID` en 415). Un refus ne consomme pas le lien de capture : le citoyen corrige et réessaie.
Statuts : `pending`, `rejected`, `moderation`, `published`, `in_progress`, `resolved` (seuls les trois derniers sont publics).
Seuils du back : GPS 50 m, point à 100 m, photo de 8 Mo maximum (JPEG, PNG ou WebP), description de 280 caractères.

## Checklist démo (critères du brief)

- [ ] Signalement complet en moins d'une minute (le temps s'affiche à la fin ; vérifié par le test e2e)
- [ ] Photo hors sujet refusée en direct (message rouge, retour à l'étape photo)
- [ ] Parcours WhatsApp : lien unique `/capture/{token}` → même page de capture → confirmation
- [ ] La mairie voit le point, change son statut, ajoute la photo « après » (Django admin, ou `/mairie` en bonus)
- [ ] Aucune donnée personnelle sur `/carte` et `/suivi`
- [ ] Testé sur un vrai Android **et** un vrai iPhone, autorisations caméra/GPS déjà accordées
- [ ] Plan B réseau : `NEXT_PUBLIC_MAP_STYLE=osm` si OpenFreeMap rame, captures d'écran de secours
