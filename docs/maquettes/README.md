# Maquettes d'interface

30 maquettes HTML : 10 parcours, chacun en smartphone (360 px), tablette (820 px) et ordinateur (1440 px).

**Pour les voir**, ouvre `index.html` dans un navigateur, par exemple en double-cliquant dessus. La galerie affiche tous les parcours, et un clic sur un aperçu ouvre la maquette en taille réelle. Il n'y a ni serveur ni dépendance, et tout marche hors ligne.

Ce sont des exports statiques : les champs, menus et boutons ne réagissent pas. Elles servent de référence visuelle et de référence de contenu (textes, libellés, états) pour coder les écrans.

## Parcours

| # | Parcours | Fichiers | Contrat `/api/v1` |
|---|---|---|---|
| 1 | Accueil | `01-accueil-*.html` | aucune route |
| 2 | Signaler : catégorie | `02-categorie-*.html` | `GET /categories` (« autre » passe en modération) |
| 3 | Signaler : photo | `03-photo-*.html` | champ `photo` de `POST /reports` (JPEG, PNG ou WebP, 8 Mo) |
| 4 | Signaler : point et publication | `04-position-*.html` | `POST /reports` (GPS 50 m, point 100 m, description 280 caractères) |
| 5 | Confirmation | `05-confirmation-*.html` | 201 `{ tracking_code, status, duplicate, support_count, message }` |
| 6 | Refus du serveur | `06-refus-*.html` | 422 `{ error: { code: "PHOTO_MISMATCH", message } }` |
| 7 | Lien WhatsApp expiré | `07-whatsapp-*.html` | `GET /capture-sessions/{token}` → 410 `TOKEN_EXPIRED` |
| 8 | Carte publique | `08-carte-*.html` | `GET /reports` (GeoJSON, aucune donnée personnelle) |
| 9 | Suivi | `09-suivi-*.html` | `GET /reports/{tracking_code}` (`history[]`, note de l'agent sans son nom) |
| 10 | Espace mairie (bonus) | `10-mairie-*.html` | `GET /agent/reports`, `PATCH /agent/reports/{code}`, `POST …/after-photo` |

## Règles suivies

- **Ant Design 6 partout**, avec le thème du design system (voir plus bas).
- **Icônes `@ant-design/icons`**, jamais d'emoji. Chaque catégorie a son icône :

  | Catégorie | Icône |
  |---|---|
  | `depot_sauvage` | `DeleteOutlined` |
  | `caniveau_bouche` | `StopOutlined` |
  | `brulage_dechets` | `FireOutlined` |
  | `eau_stagnante` | `CloudOutlined` |
  | `chaussee_degradee` | `ToolOutlined` |
  | `regard_dalle` | `WarningOutlined` |
  | `eclairage_panne` | `BulbOutlined` |
  | `vehicule_abandonne` | `CarOutlined` |
  | `autre` | `QuestionCircleOutlined` |

- **Logos** :
  - le logotype « Cotonou Signale » (« Signale » en citron) est dans l'en-tête de chaque écran ;
  - le logo « Cotonou Code la nuit » est seulement sur l'accueil, avec le fichier blanc sur `marque` et le violet sur `fond`. Les deux fichiers sont dans `assets/`.
- **Mobile d'abord** : cibles de 44 px, corps de texte en 16 px (pas de zoom iOS dans les champs).

## Cohérence avec le contrat d'API

- **Statuts publics** : « Publié », « Pris en charge », « Résolu ». « Nouveau » n'est plus utilisé. Les autres statuts sont « En modération », « En cours de vérification » et « Rejeté ».
- **Catégories** : slugs et libellés de `GET /categories`. « Autre problème » passe en modération.
- **Messages du serveur** : affichés mot pour mot, donc au vouvoiement. Le reste de l'interface tutoie, comme le design system. Exemples :
  - « Signalement publié. Suivez-le avec ce code. »
  - « La photo ne correspond pas à la catégorie choisie. »
  - « Ce lien de signalement a expiré. Demandez-en un nouveau. »
- **Code de suivi** : au format `CS-7K3F9Q`.
- **Seuils** :

  | Élément | Limite |
  |---|---|
  | Précision du GPS | 50 m |
  | Distance du point | 100 m |
  | Photo | 8 Mo, JPEG, PNG ou WebP |
  | Description | 280 caractères |
  | Note de l'agent | 280 caractères |

- **Après l'envoi** : le back n'envoie aucune confirmation dans WhatsApp, donc aucune maquette n'en promet.
- **Suivi** : l'historique affiche la note de l'agent, jamais son nom.
- **Espace mairie** :
  - les compteurs se calculent à partir de la liste, car il n'y a pas de route de statistiques ;
  - la liste montre `channel` (WhatsApp ou web) et `support_count` (habitants) ;
  - la vérification IA vient de `ai_verdict.matches_category` et `ai_verdict.confidence` ;
  - « Marquer comme résolu » envoie la note. Avec une photo « après », c'est `POST after-photo`, qui passe le signalement en Résolu.

## Thème Ant Design des maquettes

`components/AntdProvider.tsx` ne règle aujourd'hui que `colorPrimary`, `colorLink`, `colorText`, `borderRadius` et `fontFamily`. Les maquettes utilisent ce thème plus complet, tiré des jetons du design system :

```ts
const theme = {
  token: {
    colorPrimary: "#3a0c6f", colorLink: "#481689", colorInfo: "#481689",
    colorSuccess: "#15803d", colorWarning: "#c2410c", colorError: "#dc2626",
    colorSuccessBg: "#f0fdf4", colorSuccessBorder: "#bbf7d0",
    colorErrorBg: "#fef2f2", colorErrorBorder: "#fecaca",
    colorWarningBg: "#fffbeb", colorWarningBorder: "#fde68a",
    colorInfoBg: "#efebf5", colorInfoBorder: "#dbd4e5",
    colorText: "#1b1327", colorTextSecondary: "#4d445f", colorTextTertiary: "#6d657f",
    colorBgLayout: "#f9f8fb", colorFillAlter: "#efebf5",
    colorBorder: "#6d657f", colorBorderSecondary: "#dbd4e5", colorSplit: "#dbd4e5",
    borderRadius: 10, borderRadiusLG: 12, borderRadiusSM: 8,
    fontSize: 16, controlHeight: 44, controlHeightLG: 52, controlHeightSM: 32,
  },
  components: {
    Button: { fontWeight: 600, primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
    Card: { headerFontSize: 16 },
  },
};
// En-tête sur « marque » : ConfigProvider imbriqué avec colorText "#ffffff" et colorTextSecondary "#dbd1eb".
// Action principale (une par écran) : ConfigProvider imbriqué avec colorPrimary "#bae206"
// et Button { primaryColor: "#3a0c6f", fontWeight: 700, contentFontSizeLG: 18 }.
```

Couleurs des statuts (`Tag` en `variant="solid"`, marqueurs de carte) :

| Statut | Couleur |
|---|---|
| Publié | `#dc2626` |
| Pris en charge | `#c2410c` |
| Résolu | `#15803d` |
| En modération | `#481689` |
| En cours de vérification, Rejeté | `#6b7280` |

## Points à trancher dans le code

- **Ant Design sur les pages citoyennes** : `AGENTS.md` et un test e2e demandent que les pages citoyennes ne chargent pas Ant Design, alors que les maquettes l'utilisent partout. Il faut choisir l'un ou l'autre, puis mettre à jour la règle ou les maquettes.
- **Emoji restants** : `lib/categories.ts` porte encore des emoji dans `icone`. Il faut les remplacer par les icônes du tableau plus haut.

## Source

Ces fichiers sont exportés du canevas de design du projet. Pour changer une maquette, il faut modifier le canevas puis exporter à nouveau, plutôt qu'éditer le HTML à la main : les styles Ant Design y sont figés.
