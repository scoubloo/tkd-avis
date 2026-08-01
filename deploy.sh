#!/usr/bin/env bash
# =============================================================================
#  Déploiement d'Avis TKD sur le VPS.
#
#  Propriétés tenues :
#   - AUCUN des quatre conteneurs protégés n'est touché (n8n, traefik, litellm,
#     postgres). Le script refuse de démarrer s'il détecte le contraire ;
#   - chaque image est étiquetée par le commit qui l'a produite : le retour
#     arrière est une commande, pas une reconstruction ;
#   - la migration tourne AVANT que le trafic n'arrive ;
#   - le script échoue si la page publique ne répond pas — il ne se déclare
#     jamais réussi sans l'avoir vérifié de l'extérieur.
# =============================================================================
set -Eeuo pipefail

VPS_HOTE="${VPS_HOTE:?exporter VPS_HOTE=utilisateur@adresse-du-serveur}"
VPS_CLE="INFRA/.secrets/ssh/aeterna_v2_ed25519"
DISTANT="/docker/tkd-avis"
URL_PUBLIQUE="https://n8n.srv1314704.hstgr.cloud/tkd-avis"
PROTEGES="n8n-n8n-1 n8n-traefik-1 aeterna-litellm aeterna-postgres"

cd "$(dirname "$0")"
RACINE_DEPOT="$(cd ../.. && pwd)"
ETIQUETTE="$(git rev-parse --short HEAD 2>/dev/null || echo manuel)"

ssh_vps() { ssh -i "$RACINE_DEPOT/$VPS_CLE" -o ConnectTimeout=15 "$VPS_HOTE" "$@"; }

echo "▸ Empreinte des conteneurs protégés (avant)"
AVANT="$(ssh_vps "docker ps --format '{{.Names}} {{.Status}}' | grep -E '$(echo $PROTEGES | tr ' ' '|')' | sort")"
echo "$AVANT" | sed 's/^/    /'

echo "▸ Envoi des sources (sans node_modules, sans .next, sans données)"
# Le répertoire distant est VIDÉ d'abord (en gardant les données et la
# configuration). Sans ça, un fichier supprimé côté dépôt survit indéfiniment
# sur le serveur : c'est ainsi qu'un résidu macOS « ._0001_initial.sql » est
# resté trois déploiements et a fait échouer les migrations.
# `COPYFILE_DISABLE=1` empêche tar d'en créer de nouveaux.
COPYFILE_DISABLE=1 tar --no-xattrs \
    --exclude=node_modules --exclude=.next --exclude=donnees --exclude=.git \
    --exclude=test-results --exclude=playwright-report -czf - . \
  | ssh_vps "mkdir -p $DISTANT \
      && find $DISTANT -mindepth 1 -maxdepth 1 ! -name donnees ! -name .env -exec rm -rf {} + \
      && tar -xzf - -C $DISTANT \
      && find $DISTANT -name '._*' -delete"

echo "▸ Dépôt du fichier de configuration (chmod 600)"
scp -q -i "$RACINE_DEPOT/$VPS_CLE" "$RACINE_DEPOT/INFRA/.secrets/tkd-avis.env" "$VPS_HOTE:$DISTANT/.env"
ssh_vps "chmod 600 $DISTANT/.env"

echo "▸ Construction de l'image  tkd-avis:$ETIQUETTE"
ssh_vps "cd $DISTANT && docker build -q -t tkd-avis:$ETIQUETTE -t tkd-avis:current . >/dev/null && echo '    image construite'"

echo "▸ Démarrage des conteneurs"
ssh_vps "cd $DISTANT && TKD_TAG=current docker compose up -d --remove-orphans"

echo "▸ Attente de la base"
ssh_vps "for i in \$(seq 1 30); do docker exec tkd-avis-db pg_isready -U tkd -d tkd_avis >/dev/null 2>&1 && exit 0; sleep 2; done; echo 'base injoignable'; exit 1"

echo "▸ Migrations"
ssh_vps "docker exec tkd-avis-app node scripts/migrate.mjs"

echo "▸ Catalogue des cours"
ssh_vps "docker exec tkd-avis-app node scripts/seed.mjs"

echo "▸ Vérification depuis l'extérieur"
for i in $(seq 1 20); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL_PUBLIQUE/api/health" || true)"
  [ "$CODE" = "200" ] && break
  sleep 3
done
if [ "${CODE:-}" != "200" ]; then
  echo "✖ La sonde publique répond $CODE — déploiement NON validé."
  ssh_vps "docker logs --tail 40 tkd-avis-app" || true
  exit 1
fi
echo "    /api/health → 200"

# UNE SEULE requête sert à la fois pour le code et pour le contenu.
# En faire deux introduisait une course pendant le redémarrage du conteneur :
# le corps venait d'un instant, le code d'un autre, et le script accusait à tort
# la page d'être vide. `-L` suit la redirection 308 par laquelle Next.js
# normalise la barre finale.
TEMPORAIRE="$(mktemp)"
trap 'rm -f "$TEMPORAIRE"' EXIT
for i in $(seq 1 10); do
  CODE_ACCUEIL="$(curl -sL -o "$TEMPORAIRE" -w '%{http_code}' "$URL_PUBLIQUE/" || echo 000)"
  [ "$CODE_ACCUEIL" = "200" ] && grep -q "Les cours de taekwondo" "$TEMPORAIRE" && break
  sleep 2
done
echo "    page d'accueil → $CODE_ACCUEIL"
[ "$CODE_ACCUEIL" = "200" ] || { echo "✖ L'accueil ne répond pas 200."; exit 1; }
grep -q "Les cours de taekwondo" "$TEMPORAIRE" \
  || { echo "✖ L'accueil répond 200 mais ne contient pas son titre."; exit 1; }
echo "    titre présent dans le HTML servi"

# Le catalogue vient de la base : si les huit cours s'affichent, la chaîne
# complète application → base est prouvée de l'extérieur.
# `grep -o … | wc -l` et non `grep -c` : le second compte les LIGNES qui
# contiennent le motif, et le HTML rendu tient sur une seule ligne — il aurait
# répondu « 1 » quel que soit le nombre de cours.
NB_COURS="$(grep -o 'cours-carte__nom' "$TEMPORAIRE" | wc -l | tr -d ' ')"
echo "    cours affichés depuis la base → $NB_COURS"
[ "$NB_COURS" -ge 8 ] || { echo "✖ Le catalogue ne s'affiche pas (attendu au moins 8)."; exit 1; }

PAGE="$(cat "$TEMPORAIRE")"

# ⚠️ Contrôle qui manquait le 31/07/2026 sur un autre site : une page peut
# répondre 200 et s'afficher SANS AUCUN STYLE si sa feuille de style est en 404.
# On lit donc le lien réellement servi — on ne le reconstruit pas — et on le
# demande vraiment.
CSS="$(echo "$PAGE" | grep -o 'href="[^"]*\.css[^"]*"' | head -1 | sed 's/href="//;s/"$//')"
if [ -z "$CSS" ]; then
  echo "✖ Aucune feuille de style référencée dans la page servie."
  exit 1
fi
case "$CSS" in http*) URL_CSS="$CSS" ;; *) URL_CSS="https://n8n.srv1314704.hstgr.cloud$CSS" ;; esac
LOT_CSS="$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "$URL_CSS")"
echo "    feuille de style ($CSS) → $LOT_CSS"
case "$LOT_CSS" in
  200*text/css*) : ;;
  *) echo "✖ La feuille de style référencée n'est pas servie correctement."; exit 1 ;;
esac

echo "▸ Empreinte des conteneurs protégés (après)"
APRES="$(ssh_vps "docker ps --format '{{.Names}} {{.Status}}' | grep -E '$(echo $PROTEGES | tr ' ' '|')' | sort")"
echo "$APRES" | sed 's/^/    /'
if [ "$AVANT" != "$APRES" ]; then
  echo "✖ ATTENTION : l'état d'un conteneur protégé a changé pendant le déploiement."
  exit 1
fi
echo "    inchangés"

echo
echo "✔ Déployé — $URL_PUBLIQUE"
echo "  Étiquette : tkd-avis:$ETIQUETTE"
echo "  Retour arrière : ssh … \"cd $DISTANT && TKD_TAG=<étiquette_precedente> docker compose up -d tkd-avis-app\""
