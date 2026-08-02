#!/usr/bin/env bash
# =============================================================================
#  Avis TKD — une commande, et le projet tourne.
#
#  Rien à installer, rien à configurer, aucun fichier à remplir : la base de
#  données et la boîte aux lettres sont embarquées. Ce que la machine a
#  d'installé comme moteur de base (PostgreSQL, MariaDB, MySQL, rien du tout)
#  n'a aucune importance.
#
#      ./demarrer.sh            démarre
#      ./demarrer.sh --arreter  arrête
#      ./demarrer.sh --effacer  arrête ET jette la base (repart de zéro)
# =============================================================================
set -Eeuo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.local.yml"
URL="http://localhost:3000/tkd-avis"

echoerr() { printf '%s\n' "$@" >&2; }

# --- Docker est-il là, et tourne-t-il vraiment ? -----------------------------
# On teste les DEUX : « docker existe » ne dit pas « le démon répond ». Sur un
# Mac fraîchement démarré, la commande existe et le démon dort.
if ! command -v docker >/dev/null 2>&1; then
  echoerr ""
  echoerr "  Docker n'est pas installé, et c'est la seule chose dont ce projet a besoin."
  echoerr ""
  echoerr "    macOS / Windows : https://www.docker.com/products/docker-desktop/"
  echoerr "    Linux           : https://docs.docker.com/engine/install/"
  echoerr ""
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echoerr ""
  echoerr "  Docker est installé mais ne répond pas — il est probablement à l'arrêt."
  echoerr "  Ouvre Docker Desktop, attends qu'il soit démarré, puis relance cette commande."
  echoerr ""
  exit 1
fi

case "${1:-}" in
  --arreter)
    $COMPOSE down
    echo "Arrêté. Les données sont conservées : ./demarrer.sh repart où on en était."
    exit 0
    ;;
  --effacer)
    $COMPOSE down -v
    echo "Arrêté et base effacée. Le prochain ./demarrer.sh repart d'une base neuve."
    exit 0
    ;;
  '') : ;;
  *)
    echoerr "Option inconnue : $1  (attendu : --arreter ou --effacer)"
    exit 1
    ;;
esac

echo "▸ Construction et démarrage (la première fois prend quelques minutes)"
$COMPOSE up --build -d

# --- Attendre que ce soit RÉELLEMENT prêt ------------------------------------
# On interroge la page, pas l'état du conteneur : « démarré » ne veut pas dire
# « répond ». Les migrations et le jeu de démonstration tournent avant le
# serveur web, donc le conteneur est « up » bien avant d'être utilisable.
echo "▸ Attente de l'application"
for _ in $(seq 1 90); do
  if curl -sf "$URL/api/health" >/dev/null 2>&1; then
    PRET=1
    break
  fi
  sleep 2
done

if [ -z "${PRET:-}" ]; then
  echoerr ""
  echoerr "  L'application n'a pas répondu dans le temps imparti. Les journaux :"
  echoerr ""
  $COMPOSE logs --tail 40 app >&2
  exit 1
fi

cat <<FIN

  ✔ C'est prêt.

    Le site            $URL
    Les e-mails        http://localhost:8025
                       (l'inscription envoie un vrai e-mail : il arrive là,
                        pas sur Internet — le lien de confirmation se clique)

    Comptes déjà prêts, adresse déjà confirmée :
      camille@exemple.fr   administrateur   demo1234
      yanis@exemple.fr     membre           demo1234
      nadia, thomas, lea   membre           demo1234

    Arrêter            ./demarrer.sh --arreter
    Repartir de zéro   ./demarrer.sh --effacer

FIN
