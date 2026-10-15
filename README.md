# Cotonou Signale — front Next.js

Des signalements citoyens vérifiés, pour une ville plus propre. Cotonou Code la nuit, 15 octobre 2026.

## Démarrer (2 min)

```bash
corepack enable            # active pnpm (fourni avec Node 22)
pnpm install
cp .env.example .env.local
pnpm dev                   # http://localhost:3000
```

Par défaut, l'app tourne sur des **données simulées** (badge MOCKS en haut à droite) : pas besoin d'attendre Django.
Quand l'API est prête : `NEXT_PUBLIC_MOCKS=0` et `BACKEND_URL=http://localhost:8000` dans `.env.local`.

## Tests et vérification

```bash
pnpm test          # tests unitaires et de composants (Vitest + Testing Library), dans tests/unit
pnpm verify        # lint + types + tests + build : obligatoire avant chaque PR
pnpm test:e2e      # parcours de bout en bout (Playwright), après un build
```

Chaque fonctionnalité arrive avec ses tests. Règles complètes pour les humains et les agents IA : `AGENTS.md`.
Résultats de l'atelier design thinking (personas, parcours testés, priorités) : `docs/design-thinking.md`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`) : sur chaque PR et chaque fusion, le contrôle **« Qualité »** installe avec le lockfile figé,
  puis lance lint, types, tests unitaires, build et parcours e2e. Une PR rouge ne se fusionne pas.
- **Protection de `main`** (à régler une fois dans GitHub › Settings › Branches) : PR obligatoire, contrôle « Qualité » requis,
  une relecture, pas de push direct.
- **CD** : sur la machine de démo, `pnpm demo:cd` suit `origin/main` ; à chaque fusion, il réinstalle, rebuild et redémarre
  (si le build échoue, l'ancienne version reste en ligne). Le tunnel Cloudflare pointe sur ce serveur.

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
| `tailwindcss` 4 | Mise en page mobile rapide, jetons de couleur partagés |
| `dayjs` | Dates en français (« il y a 3 jours ») ; c'est aussi la bibliothèque de dates d'antd |
| `maplibre-gl` | Carte vectorielle libre (OpenStreetMap), sans clé ni quota |
| `vitest`, `@testing-library/react`, `jsdom` | Tests unitaires et de composants, rapides |
| `@playwright/test` | Parcours de bout en bout sur un téléphone émulé, en CI |
| `swagger-typescript-api` | `pnpm api:generate` : types générés depuis le schéma OpenAPI de Django, dès qu'il est exposé (`/api/schema/`) |
| `eslint` (config Next) | Règles React et Next, dont celles du compilateur React |
| pnpm | Installations rapides, lockfile strict, mêmes versions pour tous et en CI |

## Pages et équipes

| Équipe | Pages | Fichiers |
|---|---|---|
| **Capture** | `/signaler` | `app/signaler`, `components/signalement`, `components/CameraCapture.tsx`, `hooks/useGeolocalisation.ts` |
| **WhatsApp + suivi** | `/s/[token]`, `/suivi`, `/suivi/[numero]` | `app/s`, `app/suivi` |
| **Carte** | `/carte` | `app/carte` |
| **Bonus** | `/mairie` (Ant Design) | `app/mairie` — seulement si tous les P0 sont livrés ; sinon la mairie utilise **Django admin** |
| **Mentor front** | fichiers partagés, CI/CD | `lib/`, `hooks/useSignalements.ts`, `components/carte`, `components/ui.tsx`, `components/*Provider.tsx`, `.github/` |

Raccourcis en mode simulé : `/s/expire` et `/s/utilise` (liens invalides), identifiant `elu` sur `/mairie`,
`NEXT_PUBLIC_MOCK_REFUS=photo_hors_sujet` pour afficher un refus.

## Organisation GitHub

- Une branche par équipe : `front/capture`, `front/whatsapp`, `front/carte`.
- Une PR par ticket (issue), toutes les 20 à 30 min, avec le modèle `.github/pull_request_template.md`.
- Issues avec labels d'équipe et `P0` / `P1`, suivies dans un tableau GitHub Projects.

## Contrat d'API avec Django

Conventions : JSON en snake_case, **pas de slash final** (`DefaultRouter(trailing_slash=False)`),
erreurs métier en **422** au format `{ "code": "...", "message": "..." }`. Types exacts dans `lib/types.ts`
(remplacés par les types générés via `pnpm api:generate` dès que le schéma OpenAPI est exposé).

| Méthode | Route | Corps / réponse |
|---|---|---|
| POST | `/api/signalements` | multipart : `categorie`, `photo`, `photo_prise_le`, `lat_gps`, `lng_gps`, `precision_m`, `lat`, `lng`, `description?`, `token?` → 201 `{ numero_suivi, statut, doublon }` ou 422 |
| GET | `/api/signalements/public` | liste de `SignalementPublic` (point du problème, photo floutée, **aucune donnée perso**) |
| GET | `/api/signalements/{numero}` | `SignalementPublic` |
| GET | `/api/wa/{token}` | `{ valide, raison?: "expire" \| "utilise" \| "inconnu", expire_a? }` |

Bonus (espace mairie en front, token DRF `Authorization: Token <clé>`) :

| Méthode | Route | Corps / réponse |
|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` → `{ token, nom, role: "agent" \| "elu", service }` |
| GET | `/api/mairie/signalements?statut=&service=` | liste de `SignalementMairie` |
| PATCH | `/api/mairie/signalements/{numero}` | `{ statut }` → `SignalementMairie` |
| POST | `/api/mairie/signalements/{numero}/photo-apres` | multipart `photo` → `SignalementMairie` |

Codes de refus attendus : `photo_hors_sujet`, `capture_ecran`, `photo_ancienne`, `hors_cotonou`, `trop_loin`,
`precision_insuffisante`, `lien_expire`, `lien_utilise`. Statuts : `nouveau`, `pris_en_charge`, `resolu`, `rejete`.
Catégories : voir `lib/categories.ts`.

## Checklist démo (critères du brief)

- [ ] Signalement complet en moins d'une minute (le temps s'affiche à la fin ; vérifié par le test e2e)
- [ ] Photo hors sujet refusée en direct (message rouge, retour à l'étape photo)
- [ ] Parcours WhatsApp : lien unique `/s/{token}` → même page de capture → confirmation
- [ ] La mairie voit le point, change son statut, ajoute la photo « après » (Django admin, ou `/mairie` en bonus)
- [ ] Aucune donnée personnelle sur `/carte` et `/suivi`
- [ ] Testé sur un vrai Android **et** un vrai iPhone, autorisations caméra/GPS déjà accordées
- [ ] Plan B réseau : `NEXT_PUBLIC_MAP_STYLE=osm` si OpenFreeMap rame, captures d'écran de secours
