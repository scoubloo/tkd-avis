# Avis TKD

Application web d'avis sur des cours de taekwondo : chacun crée un compte,
confirme son adresse e-mail, puis note les cours auxquels il a participé.
Un back-office permet de suivre les utilisateurs et les cours.

**En ligne : https://n8n.srv1314704.hstgr.cloud/tkd-avis**

> Les cours, les professeurs et le lieu affichés sont **fictifs**. Les adresses
> e-mail en `@exemple.fr` appartiennent à un domaine réservé par la RFC 2606 :
> aucun message ne peut partir vers une vraie personne.

---

## Ce que fait l'application

**Côté visiteur**
- inscription par e-mail et mot de passe ;
- confirmation de l'adresse par un lien reçu par e-mail, valable 24 h, à usage unique ;
- dépôt d'un avis sur un cours : une note de 1 à 5 et une description ;
- un seul avis par personne et par cours, modifiable et supprimable ;
- récupération de toutes ses données en un clic, suppression de son compte en un clic.

**Côté administrateur**
- liste des utilisateurs : adresse, nombre de cours notés, moyenne des notes données ;
- liste des cours : nombre de notes et moyenne ;
- fiche d'un cours : répartition des notes et détail de chaque avis.

---

## Pile technique

| Brique | Choix | Pourquoi |
|---|---|---|
| Interface et serveur | Next.js 15 (App Router), React 19, TypeScript strict | un seul processus pour le rendu et les actions ; pas de découpage artificiel sur un projet de cette taille |
| Base | PostgreSQL 16, requêtes via Drizzle | les règles d'intégrité vivent **dans** la base, pas seulement dans le code |
| Migrations | SQL versionné, appliqué par `scripts/migrate.mjs` | relisible à l'œil, empreinte vérifiée : une migration déjà appliquée ne peut plus être modifiée en douce |
| Mots de passe | argon2id (19 Mio, 2 passes, 1 fil — paramètres OWASP) | la référence actuelle |
| E-mails | Nodemailer + SMTP | les messages partent réellement |
| Validation | Zod, côté serveur systématiquement | les contrôles du navigateur sont un confort, pas une protection |
| Tests | Vitest (unitaires) + Playwright (bout en bout, ordinateur et téléphone) | |
| Livraison | Docker multi-étapes, Traefik, script de déploiement qui vérifie de l'extérieur | |

Aucune dépendance payante, aucune clé d'API, aucun service tiers dans les pages.

---

## Structure

```
db/migrations/      le schéma, en SQL versionné
scripts/            migration · catalogue · rôle admin · ménage · jeu de démonstration
src/db/             connexion et reflet typé du schéma
src/lib/auth/       mots de passe, jetons, sessions, gardes d'accès
src/lib/actions/    les actions serveur (inscription, connexion, avis, compte)
src/lib/            configuration, e-mails, limitation de débit, validation, formats
src/app/            les écrans
tests/unit/         logique pure : mots de passe, jetons, moyennes, validation
tests/e2e/          parcours réels dans un navigateur
```

---

## Faire tourner le projet

```bash
npm install
cp .env.example .env     # puis renseigner DATABASE_URL et le SMTP
npm run db:migrate && npm run db:seed
npm run dev              # http://localhost:3210/tkd-avis
```

**Vérification complète avant toute livraison :**

```bash
npm run verify
```

(types + tests unitaires + construction). Les tests de bout en bout, qui
demandent une base dédiée, se lancent par `./tests/e2e/lancer.sh`.

**Déploiement :**

```bash
./deploy.sh
```

Le script envoie les sources, construit l'image, applique les migrations, puis
**vérifie depuis l'extérieur** que la page répond, qu'elle contient bien son
contenu, que le catalogue vient de la base et que la feuille de style est
réellement servie. Il échoue si l'un de ces points tombe, et il contrôle
qu'aucun conteneur protégé du serveur n'a été recréé.

Retour arrière : chaque image porte l'empreinte du commit qui l'a produite.

```bash
ssh … "cd /srv/tkd-avis && TKD_TAG=<empreinte> docker compose up -d tkd-avis-app"
```

---

## Décisions notables

- **Un avis par personne et par cours**, garanti par une contrainte d'unicité en
  base. Sans elle, une seule personne peut voter vingt fois et fausser une moyenne.
- **Aucune moyenne n'est stockée** : tout se recalcule à la lecture. Un agrégat
  dupliqué finit toujours par diverger de ce qu'il résume.
- **Aucune adresse e-mail n'est publiée**, même partiellement masquée : les avis
  sont signés « Membre ». Le service n'a pas besoin de l'afficher.
- **On ne devient administrateur que par une commande sur le serveur**
  (`scripts/set-admin.mjs`). Aucun chemin depuis le site.
- **Un non-administrateur reçoit 404 sur `/admin`**, pas 403 : répondre
  « interdit » confirmerait l'existence de la page.
- **L'inscription répond la même chose que l'adresse existe ou non**, et la
  connexion prend le même temps qu'un compte existe ou non. Le titulaire d'une
  adresse déjà inscrite reçoit un e-mail l'avertissant de la tentative.
- **Le sous-chemin `/tkd-avis` n'est traité qu'une fois** (`basePath` côté
  application, aucun `stripprefix` côté Traefik). Le traiter deux fois casse
  toutes les ressources.

## Limites connues, écrites plutôt que tues

- Les e-mails partent par un compte Gmail personnel : une copie de chaque
  message reste dans sa boîte d'envoi. C'est écrit dans la page « Données
  personnelles ». Un prestataire d'envoi transactionnel avec contrat de
  sous-traitance serait le vrai correctif.
- L'application partage son nom d'hôte avec sept autres démonstrations : une XSS
  dans l'une d'elles serait *same-origin* avec celle-ci. Un sous-domaine dédié est
  le seul correctif complet ; il demande un certificat.
