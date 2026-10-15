<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cotonou Signale — guide des agents (et des humains)

Ce fichier est la **source unique** des règles du front, au format ouvert [AGENTS.md](https://agents.md) :
**le même fichier pour tous les agents**, quel que soit le fournisseur (Claude, ChatGPT/Codex, Gemini, Copilot, Cursor…).

- **Aucun fichier d'instructions propre à un outil** : pas de `CLAUDE.md`, `GEMINI.md`, `CHATGPT.md`, `.cursorrules`,
  `.github/copilot-instructions.md`… `pnpm check:agents` (lancé par `pnpm verify` et la CI) refuse ces fichiers.
- Un outil qui ne charge pas `AGENTS.md` tout seul reçoit comme première consigne : « Lis AGENTS.md et applique-le ».
- On n'écrit pas les règles ailleurs (ni dans un prompt, ni en double). Une règle manque ? On l'ajoute ici, dans une PR.

## 1. Avant de coder : lire, dans cet ordre

1. Ce fichier.
2. `docs/design-thinking.md` : personas, questions « Comment pourrions-nous », parcours papier testés, priorités.
3. La maquette validée de l'écran (Claude Design). Pas de maquette validée = on ne code pas l'écran.
4. `README.md` (contrat d'API) et `lib/types.ts`.
5. Les composants et modules existants (`components/`, `lib/`, `hooks/`) : **chercher une brique existante avant d'en créer une**.

Annoncer avant de commencer : l'écran concerné, le ticket (issue), les états et tailles d'écran qui serviront à la vérification.
Ne jamais inventer une fonctionnalité hors backlog, ni un chiffre, un témoignage, un badge ou une donnée « pour faire joli ».

## 2. Architecture

- `app/` compose les pages ; pas de logique réutilisable dans une page.
- Un composant propre à un écran reste à côté de sa page ou dans `components/<domaine>/`. Il ne devient partagé que s'il sert plusieurs écrans.
- **Données serveur : uniquement via les hooks TanStack Query** de `hooks/useSignalements.ts` (cache, chargement, erreur,
  rafraîchissement auto). Les hooks appellent `lib/api.ts` (axios, version simulée + version réelle).
  Jamais de `fetch` ni d'axios dans un composant. Les clés de requête sont centralisées (`cles`) ; une mutation invalide les données qu'elle modifie.
- Dates : `lib/dates.ts` (dayjs, en français). Icônes `@ant-design/icons` : dans les composants clients uniquement.
- `lib/types.ts` = contrat avec Django. Les types d'API ne sont jamais retapés ailleurs ; on les dérive (`Pick`, `Omit`).
  Modifier le contrat = prévenir l'équipe back et mettre à jour le README dans la même PR.
- Catégories, services, statuts : uniquement depuis `lib/categories.ts`. Cartes : uniquement via `@/components/carte`.
- Pas de fichiers fourre-tout `helpers`, `utils` ni `*_partN` : nommer chaque module par sa responsabilité (`geo.ts`, `image.ts`…).
- **400 lignes maximum par fichier** : au-delà, découper par responsabilité.
- `"use client"` sur la plus petite frontière interactive. Paramètres de route via `useParams()`.
- Fichiers partagés (`lib/`, `components/carte`, `components/ui.tsx`, `components/AntdProvider.tsx`) : modifiés seulement avec l'accord du mentor front.

## 3. Mobile d'abord (obligatoire) et interface

Les citoyens signalent depuis la rue, sur des téléphones d'entrée de gamme et des forfaits limités.
**Chaque écran est conçu, codé et testé d'abord pour un téléphone de 360 px de large**, puis élargi si besoin. Jamais l'inverse.

- Classes Tailwind **sans préfixe = mobile** ; `sm:`, `md:`… servent seulement à agrandir. Pas de mise en page « bureau » rattrapée ensuite.
- **Cibles tactiles de 44 px minimum** (`min-h-11`) ; une seule action principale par écran, **en bas, dans la zone du pouce**
  (bouton collé en bas avec `sticky bottom-0`).
- Texte d'au moins **16 px dans les champs** (sinon iOS zoome) ; aucune fonction qui dépende du survol de la souris.
- Hauteurs en **`dvh`** (pas `vh`) ; marges des écrans à encoche avec `env(safe-area-inset-*)`.
- **Aucun défilement horizontal à 360 px** : vérifié par `tests/e2e/mobile.spec.ts`, avec la taille des cibles tactiles.
- **Réseau lent** : photo compressée et progression d'envoi visible ; chargement et erreur toujours affichés ;
  l'écran reste utilisable si la carte ne charge pas ; aucune librairie lourde sur les pages citoyennes.
- **Ant Design n'est chargé que dans `app/(agents)/`** (espace mairie et connexion) ; les pages citoyennes utilisent Tailwind seul
  (vérifié en e2e). Ne jamais remettre antd dans `app/layout.tsx`.
- Les maquettes Claude Design se font d'abord en format mobile. On teste sur un vrai Android d'entrée de gamme, puis un iPhone ;
  dans le navigateur, mode appareil 360 px et réseau « 3G lente ».

**Interface**

- Interface en **français**.
- **Pas de back-office en front par défaut** : la mairie travaille dans **Django admin** (équipe back). L'espace `/mairie`
  (`app/(agents)/mairie`, Ant Design) est un **bonus**, à toucher seulement quand tous les P0 sont livrés.
- **Tailwind** pour la mise en page et les pages citoyennes ; **Ant Design** pour les composants riches de l'espace agents.
- Un seul thème : `components/AntdProvider.tsx`. Pas de `theme={{…}}` dans une page, pas de couleur brute hors des couleurs du brief,
  pas de `!important`, pas de sélecteur `.ant-*`, pas de style global ponctuel.
- Boutons antd choisis par intention : `primary` = action principale, défaut = secondaire, `text` = tertiaire, `link` seulement avec un vrai `href`.
  Aucune classe de couleur, bordure ou rayon posée sur un `Button`.
- Formulaires de l'espace agents : composants antd dans `Form.Item`, pas d'inputs natifs.
- Retours à l'utilisateur : `App.useApp().message` pour un retour éphémère ; `Modal.confirm` avant une action destructive ;
  une modale seulement pour une décision qui bloque vraiment la suite.
- Chaque écran gère ses états : chargement, vide, erreur, contenu long. Les refus du serveur s'affichent tels quels (`messageRefus`).

## 4. Tests : obligatoires après chaque fonctionnalité

- Chaque fonctionnalité arrive **avec ses tests** dans `tests/unit/*.test.ts` (Vitest) : règles métier (GPS, 100 m, refus, doublons),
  logique de `lib/`, transformation des données, messages d'erreur.
- Un bug corrigé = un test qui l'aurait attrapé.
- Ne jamais supprimer, affaiblir ou contourner un test ou un contrôle pour « faire passer ». Un écart volontaire est expliqué dans le code et couvert par un test.
- Un composant se teste avec Testing Library (en-tête `// @vitest-environment jsdom`, modèle : `tests/unit/badge-statut.test.tsx`).
- Les parcours critiques ont un test Playwright dans `tests/e2e` (signalement en moins d'une minute, lien expiré, carte).
  Une fonctionnalité qui modifie un parcours met à jour son test e2e.
- Avant chaque PR : **`pnpm verify`** (lint + types + tests + build) doit être vert, puis `pnpm test:e2e`.

## 5. CI/CD : le filet du travail à plusieurs

- **pnpm uniquement** (jamais npm ni yarn). `pnpm-lock.yaml` est commité ; une dépendance s'ajoute avec `pnpm add` et se justifie dans la PR.
- La CI GitHub Actions (`.github/workflows/ci.yml`) lance le contrôle **« Qualité »** sur chaque PR, en 1 minute environ :
  installation figée, audit des dépendances, lint, types, tests unitaires, build, parcours e2e (dont la protection des routes).
- La CI doit rester rapide : les parcours e2e tournent **en parallèle**, donc chaque test reste indépendant (aucun état partagé,
  aucun ordre supposé). `CI_TYPES_VERIFIES` ne sert qu'au job « Build et e2e » de la CI (les types y sont vérifiés à part) :
  ne jamais le poser ailleurs.
- **Une PR rouge ne se fusionne pas.** Ne jamais désactiver, sauter ou affaiblir une étape de CI pour la faire passer.
- `main` est protégée : PR obligatoire, « Qualité » requis, une relecture (le mentor front).
- CD : la machine de démo suit `main` (`pnpm demo:cd`) ; chaque fusion est en ligne en moins de 30 secondes. Le gel de `main` 15 min avant la démo vaut aussi pour la CD.

## 6. Vérifier dans le navigateur

- Ouvrir l'écran réel sur un téléphone, via le tunnel HTTPS (caméra et GPS l'exigent).
- Tester d'abord à 360 px (vrai téléphone ou mode appareil) : toucher, chargement, erreur, état vide ; `/mairie` aussi sur ordinateur.
- Console du navigateur sans erreur. Les liens modifiés ont été ouverts.

## 7. Documentation

- Mettre à jour `README.md`, ce fichier ou `docs/` **dans la même PR** quand une commande, une règle, le contrat d'API ou une décision change.
- Les résultats de l'atelier vivent dans `docs/design-thinking.md` ; une décision qui les modifie y est notée avec sa date.
- Commentaires de code : expliquer le *pourquoi* d'une règle métier, pas répéter le code.

## 8. Git

- Vérifier la branche (`git branch --show-current`) : jamais de travail direct sur `main`.
- Classer chaque nouveau fichier avant `git add` (source, secret, sortie générée) : **jamais `git add -A` ni `git add .`**.
- Jamais de `.env.local` ni de secret dans un commit ; `.env.example` reste sans secret.
- Captures, rapports et fichiers temporaires hors du dépôt.
- Une PR = un ticket, avec le modèle `.github/pull_request_template.md` rempli.

## 9. Sécurité, routes protégées et vie privée

**Routes**

- Publiques : `/`, `/signaler`, `/s/[token]`, `/carte`, `/suivi/*`, et en API `/api/signalements*`, `/api/wa/*`.
- Protégées **côté serveur** par `proxy.ts` : pages `/mairie/*` (sinon redirection vers `/connexion`) et API `/api/mairie/*` (sinon 401).
- Toute nouvelle page ou API réservée aux agents s'ajoute au `matcher` de `proxy.ts` **et** à `PAGES_PROTEGEES` / `API_PROTEGEES`
  de `lib/securite.ts`, avec un test e2e « sans session = refus ». Masquer un bouton ou un lien n'est **pas** une protection.
- Le vrai contrôle d'accès reste celui de Django (permissions DRF par rôle) ; Django admin est réservé aux comptes staff.

**Session et secrets**

- Le jeton de session vit **uniquement** dans le cookie httpOnly `cs_jeton` (SameSite=Strict, Secure en HTTPS), posé par la route `/session`.
  Jamais dans `localStorage`, `sessionStorage`, une URL, un log ou le code. L'interface ne lit que `cs_profil` (nom, rôle, service), sans secret.
- Aucun secret dans le code ni dans une variable `NEXT_PUBLIC_*` : ces variables sont copiées dans le JavaScript envoyé au navigateur.
- Redirections : uniquement vers un chemin interne (`suiteSure`). Requêtes qui modifient : même origine (vérifiée par le proxy) + SameSite=Strict.

**Code**

- Jamais `dangerouslySetInnerHTML`, jamais de HTML construit à la main avec une donnée saisie : React échappe le texte, on le laisse faire.
- Entrées : le front valide type et longueur pour guider (photo : image de 15 Mo maximum ; description : 500 caractères) ; Django revalide tout.
- En-têtes de sécurité dans `next.config.ts` (CSP, X-Frame-Options, Permissions-Policy, HSTS) : ne jamais les affaiblir.
  Un nouveau domaine externe s'ajoute explicitement à la CSP, dans une PR qui le justifie.
- Lien WhatsApp `/s/[token]` : usage unique, 10 minutes, `Referrer-Policy: no-referrer`, jamais affiché dans les logs ni indexé.
- Dépendances : `pnpm audit --prod` tourne en CI ; aucune dépendance ajoutée sans justification dans la PR.

**Vie privée**

- Aucune page publique (`/carte`, `/suivi`) n'affiche le téléphone, le nom ou la position GPS du citoyen : seul le point du problème est public.
- Jamais de donnée personnelle (téléphone, position GPS du citoyen) dans la console ou les logs.
- On signale des **lieux, jamais des personnes**.

## 10. Compte rendu de l'agent (obligatoire en fin de tâche)

Une tâche n'est pas terminée sans ce compte rendu (à recopier dans la PR) :

```md
- Documents lus :
- Composants réutilisés :
- Tests ajoutés ou modifiés :
- Écrans et tailles d'écran testés :
- Commandes exécutées (et résultat) :
- Écarts volontaires et justification :
```

Avant de finaliser, relire son propre travail en mode revue : appels réseau hors des hooks, types d'API retapés,
couleurs brutes, thème inline, fichiers trop longs, tests manquants.
