# Cotonou Signale — front Next.js

Des signalements citoyens vérifiés, pour une ville plus propre. Cotonou Code la nuit, 15 octobre 2026.

## Démarrer (2 min)

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

Par défaut, l'app tourne sur des **données simulées** (badge MOCKS en haut à droite) : pas besoin d'attendre Django.
Quand l'API est prête : `NEXT_PUBLIC_MOCKS=0` et `BACKEND_URL=http://localhost:8000` dans `.env.local`.

## Tester sur un téléphone (obligatoire pour caméra + GPS)

Le navigateur refuse la caméra et le GPS en `http://192.168…`. Il faut du **HTTPS** :

```bash
npx cloudflared tunnel --url http://localhost:3000     # ou : ngrok http 3000
```

Ouvre l'URL `https://….trycloudflare.com` sur le téléphone. Next relaie `/api/*` et `/media/*` vers Django :
une seule URL, **pas de CORS** à configurer côté Django.
Pour la démo : `npm run build && npm start` derrière le tunnel (plus rapide et plus stable que `dev`).

## Pages et équipes

| Équipe | Pages | Fichiers |
|---|---|---|
| **Capture** | `/signaler`, `/s/[token]` (lien WhatsApp) | `app/signaler`, `app/s`, `components/signalement`, `components/CameraCapture.tsx`, `hooks/` |
| **Public** | `/carte`, `/suivi`, `/suivi/[numero]` | `app/carte`, `app/suivi` |
| **Mairie** | `/mairie` (agent + chiffres élu) | `app/mairie` |
| **Mentor front** | fichiers partagés | `lib/`, `components/carte`, `components/ui.tsx` |

Raccourcis en mode mock : `/s/expire` et `/s/utilise` (liens invalides), identifiant `elu` sur `/mairie`,
`NEXT_PUBLIC_MOCK_REFUS=photo_hors_sujet` pour afficher un refus.

## Contrat d'API avec Django

Conventions : JSON en snake_case, **pas de slash final** (`DefaultRouter(trailing_slash=False)`),
erreurs métier en **422** au format `{ "code": "...", "message": "..." }`, auth mairie par **token DRF**
(`Authorization: Token <clé>`). Types exacts dans `lib/types.ts`.

| Méthode | Route | Corps / réponse |
|---|---|---|
| POST | `/api/signalements` | multipart : `categorie`, `photo`, `photo_prise_le`, `lat_gps`, `lng_gps`, `precision_m`, `lat`, `lng`, `description?`, `token?` → 201 `{ numero_suivi, statut, doublon }` ou 422 |
| GET | `/api/signalements/public` | liste de `SignalementPublic` (point du problème, photo floutée, **aucune donnée perso**) |
| GET | `/api/signalements/{numero}` | `SignalementPublic` |
| GET | `/api/wa/{token}` | `{ valide, raison?: "expire" \| "utilise" \| "inconnu", expire_a? }` |
| POST | `/api/auth/login` | `{ username, password }` → `{ token, nom, role: "agent" \| "elu", service }` |
| GET | `/api/mairie/signalements?statut=&service=` | liste de `SignalementMairie` |
| PATCH | `/api/mairie/signalements/{numero}` | `{ statut }` → `SignalementMairie` |
| POST | `/api/mairie/signalements/{numero}/photo-apres` | multipart `photo` → `SignalementMairie` |

Codes de refus attendus : `photo_hors_sujet`, `capture_ecran`, `photo_ancienne`, `hors_cotonou`, `trop_loin`,
`precision_insuffisante`, `lien_expire`, `lien_utilise`. Statuts : `nouveau`, `pris_en_charge`, `resolu`, `rejete`.
Catégories : voir `lib/categories.ts`.

## Checklist démo (critères du brief)

- [ ] Signalement complet en moins d'une minute (le temps s'affiche à la fin)
- [ ] Photo hors sujet refusée en direct (message rouge, retour à l'étape photo)
- [ ] Parcours WhatsApp : lien unique `/s/{token}` → même page de capture → confirmation
- [ ] `/mairie` : le point apparaît (rafraîchi toutes les 10 s), changement de statut, photo « après »
- [ ] Aucune donnée personnelle sur `/carte` et `/suivi`
- [ ] Testé sur un vrai Android **et** un vrai iPhone, autorisations caméra/GPS déjà accordées
- [ ] Plan B réseau : `NEXT_PUBLIC_MAP_STYLE=osm` si OpenFreeMap rame, captures d'écran de secours
