#!/usr/bin/env node
/**
 * Jeu de démonstration : quelques comptes et quelques avis, pour que les trois
 * écrans d'administration montrent autre chose que des tableaux vides.
 *
 * ⚠️ TOUT EST FICTIF. Les adresses sont en `@exemple.fr`, un domaine réservé
 * par la RFC 2606 précisément pour cet usage : aucun e-mail ne peut partir vers
 * une vraie personne. Aucune de ces adresses n'appartient à qui que ce soit.
 *
 * Le mot de passe des comptes de démonstration est TIRÉ AU HASARD à chaque
 * exécution et affiché une seule fois, à la fin. Une constante écrite dans le
 * dépôt aurait offert à tout lecteur du code cinq comptes déjà confirmés :
 * la confirmation d'adresse et le quota d'inscriptions se contournaient d'un
 * copier-coller. Ces comptes n'ont par ailleurs aucun privilège.
 *
 * Idempotent : relancer ne crée aucun doublon.
 *
 * Le cours « Poomsae » reçoit volontairement les notes 5, 4 et 2 : c'est le cas
 * de recette du cahier des charges, dont la moyenne doit s'afficher 3,7.
 */
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquante.');
  process.exit(1);
}

// Le mot de passe est tiré ici et haché par l'application elle-même.
const MOT_DE_PASSE = process.env.MDP_DEMO ?? randomBytes(9).toString('base64url');

const COMPTES = [
  'camille@exemple.fr',
  'yanis@exemple.fr',
  'nadia@exemple.fr',
  'thomas@exemple.fr',
  'lea@exemple.fr',
];

const AVIS = [
  // Le cas de recette : 5 + 4 + 2 → moyenne 3,7
  ['camille@exemple.fr', 'poomsae-vendredi', 5, "Exactement ce que je cherchais. On décortique chaque mouvement, et Hélène reprend les postures une par une sans jamais brusquer personne."],
  ['yanis@exemple.fr', 'poomsae-vendredi', 4, "Très bon cours technique. Un peu court à mon goût, on aimerait vingt minutes de plus pour finir la forme."],
  ['nadia@exemple.fr', 'poomsae-vendredi', 2, "Le niveau annoncé est « tous niveaux » mais en pratique il faut déjà connaître les bases, sinon on décroche au bout de dix minutes."],

  ['camille@exemple.fr', 'adultes-debutants-mardi', 5, "J'ai commencé à 34 ans sans aucune expérience et je ne me suis jamais sentie ridicule. Le groupe est bienveillant, on progresse à son rythme."],
  ['thomas@exemple.fr', 'adultes-debutants-mardi', 4, "Bonne ambiance, échauffement sérieux. Le créneau de 19h30 est parfait après le travail."],
  ['lea@exemple.fr', 'adultes-debutants-mardi', 5, "Karim explique très bien. Il montre lentement, puis à vitesse réelle, puis il repasse voir chacun. Rien à redire."],

  ['thomas@exemple.fr', 'combat-jeudi', 5, "Intense. On sort lessivé mais on apprend énormément, surtout sur la gestion de la distance."],
  ['nadia@exemple.fr', 'combat-jeudi', 3, "Bon cours mais il manque un vrai temps de récupération entre les rounds. Prévoyez une deuxième bouteille d'eau."],

  ['lea@exemple.fr', 'ados-mardi', 4, "Ma fille y va depuis septembre et elle n'a pas manqué une séance. C'est le meilleur signe que je puisse donner."],
  ['camille@exemple.fr', 'renforcement-samedi', 4, "Complémentaire du reste, et accessible même quand on n'a pas envie de faire du combat. Bon travail de souplesse."],
  ['yanis@exemple.fr', 'preparation-passage-samedi', 5, "J'ai passé ma ceinture bleue grâce à ce cours. On révise exactement ce qui est demandé le jour J, sans perte de temps."],
  ['thomas@exemple.fr', 'enfants-lundi', 4, "Mon fils de 8 ans adore. Sabine tient le groupe sans jamais crier, ce qui est un exploit avec quinze enfants."],
];

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const empreinte = await hash(MOT_DE_PASSE, { memoryCost: 19_456, timeCost: 2, parallelism: 1 });

  for (const email of COMPTES) {
    await sql`
      INSERT INTO users (email, password_hash, email_verified_at)
      VALUES (${email}, ${empreinte}, now())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `;
  }

  let poses = 0;
  for (const [email, slug, note, commentaire] of AVIS) {
    const lignes = await sql`
      INSERT INTO reviews (user_id, course_id, note, commentaire)
      SELECT u.id, c.id, ${note}, ${commentaire}
        FROM users u, courses c
       WHERE u.email = ${email} AND c.slug = ${slug}
      ON CONFLICT (user_id, course_id) DO NOTHING
      RETURNING id
    `;
    poses += lignes.length;
  }

  const [bilan] = await sql`
    SELECT (SELECT count(*)::int FROM users) AS comptes,
           (SELECT count(*)::int FROM reviews) AS avis,
           (SELECT round(avg(r.note), 1)::float8
              FROM reviews r JOIN courses c ON c.id = r.course_id
             WHERE c.slug = 'poomsae-vendredi') AS moyenne_poomsae
  `;

  console.log(`✔ Démonstration : ${poses} avis ajouté(s).`);
  console.log(`  ${bilan.comptes} compte(s), ${bilan.avis} avis en base.`);
  console.log(`  Cas de recette « Poomsae » (5, 4, 2) → moyenne ${bilan.moyenne_poomsae} (attendu 3.7)`);
  console.log(`\n  Mot de passe des ${COMPTES.length} comptes de démonstration : ${MOT_DE_PASSE}`);
  console.log('  (affiché une seule fois — à recopier dans le dossier de recette)');
} catch (erreur) {
  console.error('✖ Jeu de démonstration interrompu :', erreur.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
