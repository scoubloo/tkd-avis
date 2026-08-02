#!/usr/bin/env bash
# =============================================================================
#  Prépare tout ce qu'il faut pour les tests de bout en bout, puis les lance.
#
#   1. ouvre un tunnel SSH vers la base du VPS (publiée sur la seule boucle
#      locale du serveur — elle n'est pas joignable depuis Internet) ;
#   2. crée/réinitialise la base `tkd_avis_test`, SÉPARÉE de la production ;
#   3. démarre l'application en local, en mode capture d'e-mails ;
#   4. lance Playwright ;
#   5. range tout derrière lui, même en cas d'échec.
#
#  Aucun e-mail ne part, aucune donnée de production n'est touchée.
# =============================================================================
set -Eeuo pipefail

cd "$(dirname "$0")/../.."
RACINE_DEPOT="$(cd ../.. && pwd)"
CLE="$RACINE_DEPOT/INFRA/.secrets/ssh/aeterna_v2_ed25519"
VPS="${VPS_HOTE:?exporter VPS_HOTE=utilisateur@adresse-du-serveur}"
PORT_LOCAL=55432
export CAPTURE_MAIL_FICHIER="${CAPTURE_MAIL_FICHIER:-/tmp/tkd-avis-mails.jsonl}"

nettoyer() {
  [ -n "${PID_APP:-}" ] && kill "$PID_APP" 2>/dev/null || true
  [ -n "${PID_TUNNEL:-}" ] && kill "$PID_TUNNEL" 2>/dev/null || true
}
trap nettoyer EXIT

echo "▸ Base de test (distincte de la production)"
# ⚠️ Les connexions d'un run précédent empêchent le DROP (« is being accessed by
# other users ») et faisaient échouer le script avant même de commencer. On
# ferme donc explicitement les sessions restantes avant de recréer la base.
ssh -i "$CLE" "$VPS" "docker exec tkd-avis-db psql -U tkd -d postgres -q -c \
    \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='tkd_avis_test' AND pid <> pg_backend_pid()\" >/dev/null 2>&1
  docker exec tkd-avis-db psql -U tkd -d postgres -q -c 'DROP DATABASE IF EXISTS tkd_avis_test' \
  && docker exec tkd-avis-db psql -U tkd -d postgres -q -c 'CREATE DATABASE tkd_avis_test'" >/dev/null

echo "▸ Tunnel SSH vers la base"
ssh -i "$CLE" -N -L "$PORT_LOCAL:127.0.0.1:5434" "$VPS" &
PID_TUNNEL=$!
sleep 3

MDP="$(grep '^POSTGRES_PASSWORD=' "$RACINE_DEPOT/INFRA/.secrets/tkd-avis.env" | cut -d= -f2)"
export DATABASE_URL="postgres://tkd:$MDP@127.0.0.1:$PORT_LOCAL/tkd_avis_test"
export PUBLIC_URL="http://127.0.0.1:3210/tkd-avis"
export BASE_PATH="/tkd-avis"
export SMTP_HOST="capture"
export SMTP_PORT="587"
export SMTP_USER="capture"
export SMTP_PASSWORD="capture"
export SMTP_FROM="Avis TKD (test) <test@exemple.fr>"
export MODE_TEST="1"

echo "▸ Migrations et catalogue"
node scripts/migrate.mjs
node scripts/seed.mjs

: > "$CAPTURE_MAIL_FICHIER"

# ⚠️ On construit et on sert en PRODUCTION, jamais en mode développement.
# Le serveur de développement se comporte différemment sur au moins un point qui
# compte : `redirect()` d'une action serveur y perd le sous-chemin. Tester le
# serveur de développement, c'est tester un artefact qui ne sera jamais livré.
echo "▸ Construction de production"
npx next build >/tmp/tkd-avis-build.log 2>&1 || { echo "✖ construction échouée"; tail -20 /tmp/tkd-avis-build.log; exit 1; }

# La sortie « standalone » ne contient QUE le serveur : les fichiers statiques
# et le dossier public doivent être posés à côté, sinon la page répond 200 et
# s'affiche sans aucun style — le défaut exact que le script de déploiement
# contrôle en production.
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public 2>/dev/null || true

echo "▸ Démarrage de l'application (construction de production)"
PORT=3210 node .next/standalone/server.js >/tmp/tkd-avis-serveur.log 2>&1 &
PID_APP=$!

for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:3210/tkd-avis/api/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -sf "http://127.0.0.1:3210/tkd-avis/api/health" >/dev/null \
  || { echo "✖ L'application ne démarre pas."; tail -30 /tmp/tkd-avis-serveur.log; exit 1; }

echo "▸ Tests de bout en bout"
npx playwright test "$@"
