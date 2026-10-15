#!/usr/bin/env bash
# Déploiement continu de la démo (CD) : à lancer UNE fois sur la machine de démo (`pnpm demo:cd`).
# Suit origin/main : chaque fusion est en ligne en moins d'une minute.
# - Le build se fait dans .next pendant que le serveur tourne sur une copie (.next-live) :
#   aucune coupure pendant le build, et un build en échec ne touche pas la version en ligne.
# - Le cache de build (.next/cache) reste en place : un rebuild prend quelques secondes.
# - pnpm install seulement si package.json ou pnpm-lock.yaml a changé ;
#   aucun rebuild si seuls la doc, les tests ou la CI ont changé.
# - Bascule : arrêt de l'ancien serveur, démarrage du nouveau (coupure d'environ une seconde).
# Le tunnel Cloudflare pointe sur PORT. Compatible macOS (bash 3.2) et Linux.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

PORT="${PORT:-3000}"
BRANCHE="${BRANCHE:-main}"
INTERVALLE="${INTERVALLE:-15}" # secondes entre deux vérifications de origin/main
EN_LIGNE=.next-live            # build servi ; ignoré par git et ESLint
PRET=.next-pret                # copie du nouveau build, juste avant la bascule

journal() { echo "$(date +%H:%M:%S) $*"; }

demarrer() {
  # next lancé directement (pas via pnpm) : le PID noté est celui du serveur, l'arrêt est fiable.
  NEXT_DIST_DIR="$EN_LIGNE" ./node_modules/.bin/next start -p "$PORT" >> .demo.log 2>&1 &
  echo $! > .demo.pid
}

arreter() {
  [ -f .demo.pid ] || return 0
  local pid
  pid="$(cat .demo.pid)"
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null # processus lancé par ce script : attendre sa fin libère le port
  for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
  rm -f .demo.pid
}

copier_build() {
  # Le serveur n'a besoin ni du cache ni des types générés.
  rm -rf "$PRET" && mkdir "$PRET" &&
    tar -C .next --exclude=./cache --exclude=./types -cf - . | tar -C "$PRET" -xf -
}

deployer() { # $1 = "installer" pour lancer pnpm install avant le build
  local debut=$SECONDS
  if [ "${1:-}" = installer ]; then
    pnpm install --frozen-lockfile --prefer-offline ||
      { journal "Installation en échec : la version en ligne ne change pas."; return 1; }
  fi
  pnpm build ||
    { journal "Build en échec : la version en ligne ne change pas."; return 1; }
  copier_build ||
    { journal "Copie du build en échec : la version en ligne ne change pas."; return 1; }
  arreter
  rm -rf "$EN_LIGNE" && mv "$PRET" "$EN_LIGNE" && demarrer
  journal "En ligne en $((SECONDS - debut)) s : $(git log -1 --format='%h %s')"
}

trap arreter EXIT
git checkout -q "$BRANCHE" && git pull -q --ff-only origin "$BRANCHE" || exit 1

# Après un échec, le déploiement suivant refait tout (installation comprise), quel que soit le changement.
reprise=""
deployer installer || reprise=installer

while sleep "$INTERVALLE"; do
  git fetch -q origin "$BRANCHE" || continue
  avant="$(git rev-parse HEAD)"
  [ "$avant" = "$(git rev-parse "origin/$BRANCHE")" ] && continue
  git merge -q --ff-only "origin/$BRANCHE" ||
    { journal "La copie locale a divergé de origin/$BRANCHE : intervention manuelle nécessaire."; continue; }

  if [ -z "$reprise" ] &&
    git diff --quiet "$avant" HEAD -- . ':(exclude)*.md' ':(exclude)docs' ':(exclude)tests' ':(exclude).github'; then
    journal "Doc, tests ou CI seulement : pas de rebuild ($(git log -1 --format='%h %s'))."
    continue
  fi

  etape="$reprise"
  git diff --quiet "$avant" HEAD -- package.json pnpm-lock.yaml || etape=installer
  if deployer "$etape"; then reprise=""; else reprise=installer; fi
done
