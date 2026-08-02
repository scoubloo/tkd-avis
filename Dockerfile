# =============================================================================
#  Avis TKD — image de production
#
#  Construction en plusieurs étapes : l'image finale ne contient ni le code
#  source, ni TypeScript, ni les outils de test. Ce qui n'est pas embarqué ne
#  peut pas être exploité.
# =============================================================================

# --- 1. Dépendances ----------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` installe EXACTEMENT ce que décrit package-lock.json. `npm install`
# pourrait résoudre une version différente de celle qui a été testée.
# `--ignore-scripts` : aucune dépendance n'exécute de code arbitraire en root
# pendant la construction. Les deux seuls paquets qui ont réellement besoin de
# leur script d'installation sont reconstruits explicitement, par leur nom.
RUN npm ci --no-audit --no-fund --ignore-scripts \
 && npm rebuild esbuild sharp --foreground-scripts

# --- 2. Construction ---------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- 3. Exécution ------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# La sortie « standalone » embarque le serveur et uniquement les dépendances
# réellement atteintes par le code.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Scripts d'exploitation : migrations, catalogue, ménage.
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/db ./db

# ⚠️ Ici vivait une copie de tout le code source dans l'image, pour la section
# « Coulisses ». Cette section a été retirée le 02/08/2026 (hors cahier des
# charges) et ces lignes lui ont survécu.
#
# Elles n'étaient pas inertes : la liste nommait `DOSSIER_DE_RECETTE.md`, un
# fichier qui n'existe plus dans le dépôt public — la construction échouait donc
# dès le premier `./demarrer.sh` sur une machine neuve, alors qu'elle passait
# ici. Un fichier supprimé ne se signale qu'au premier endroit qui le réclame.
#
# L'image ne porte plus son propre code source : c'est aussi de la surface
# d'attaque en moins.

# ⚠️ Le pilote PostgreSQL est copié explicitement.
# Next.js EMPAQUETTE `postgres` et `drizzle-orm` dans ses fragments serveur : ils
# n'apparaissent donc pas dans le node_modules de la sortie standalone. Le
# serveur web s'en moque — mais les scripts ci-dessus sont des programmes Node
# ordinaires, et sans cette ligne ils échouent sur « Cannot find package
# 'postgres' » au moment de migrer, c'est-à-dire au pire moment.
# `postgres` est sans aucune dépendance (vérifié) : copier son dossier suffit.
COPY --from=deps --chown=node:node /app/node_modules/postgres ./node_modules/postgres

# Jamais root : une faille dans l'application ne doit pas donner la machine.
USER node

EXPOSE 3000

# La sonde interroge réellement la base de données (voir /api/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/tkd-avis/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
