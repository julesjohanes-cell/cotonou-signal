#!/usr/bin/env bash
# Déploiement continu de la démo (CD) : à lancer UNE fois sur la machine de démo.
# Suit origin/main : à chaque fusion, réinstalle, rebuild et redémarre le serveur.
# Si le build échoue, l'ancienne version reste en ligne. Le tunnel Cloudflare pointe sur PORT.
set -uo pipefail

PORT="${PORT:-3000}"
BRANCHE="${BRANCHE:-main}"
INTERVALLE="${INTERVALLE:-60}"

demarrer() {
  pnpm start -p "$PORT" > .demo.log 2>&1 &
  echo $! > .demo.pid
}
arreter() {
  if [ -f .demo.pid ]; then kill "$(cat .demo.pid)" 2>/dev/null || true; rm -f .demo.pid; fi
}
deployer() {
  if pnpm install --frozen-lockfile && pnpm build; then
    arreter
    demarrer
    echo "$(date +%H:%M:%S) Déployé : $(git log -1 --format='%h %s')"
  else
    echo "$(date +%H:%M:%S) Build en échec : la version précédente reste en ligne."
  fi
}

trap arreter EXIT
git checkout -q "$BRANCHE" && git pull -q --ff-only origin "$BRANCHE"
deployer

while sleep "$INTERVALLE"; do
  git fetch -q origin "$BRANCHE" || continue
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCHE")" ]; then
    git pull -q --ff-only origin "$BRANCHE" && deployer
  fi
done
