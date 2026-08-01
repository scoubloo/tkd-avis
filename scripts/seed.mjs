#!/usr/bin/env node
/**
 * Insère le catalogue des cours.
 *
 * Idempotent : relancer ce script ne crée aucun doublon et ne touche à aucun
 * avis existant. Il met à jour les libellés si le catalogue a changé.
 *
 * ⚠️ Ces huit cours sont inventés pour la démonstration. Aucun club réel n'est
 * désigné, aucun professeur réel n'est nommé.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquante.');
  process.exit(1);
}

const COURS = [
  {
    slug: 'baby-tkd-mercredi',
    nom: 'Baby taekwondo',
    professeur: 'Sabine Oro',
    jour: 3,
    heure: '14:00',
    duree_min: 45,
    niveau: 'Débutant (4-6 ans)',
    lieu: 'Gymnase Jean-Guimier — salle 2',
  },
  {
    slug: 'enfants-lundi',
    nom: 'Enfants — ceintures blanches à jaunes',
    professeur: 'Sabine Oro',
    jour: 1,
    heure: '17:30',
    duree_min: 60,
    niveau: 'Débutant (7-11 ans)',
    lieu: 'Gymnase Jean-Guimier — salle 2',
  },
  {
    slug: 'ados-mardi',
    nom: 'Adolescents — tous niveaux',
    professeur: 'Karim Belaïd',
    jour: 2,
    heure: '18:00',
    duree_min: 75,
    niveau: 'Tous niveaux (12-16 ans)',
    lieu: 'Gymnase Jean-Guimier — grande salle',
  },
  {
    slug: 'adultes-debutants-mardi',
    nom: 'Adultes débutants',
    professeur: 'Karim Belaïd',
    jour: 2,
    heure: '19:30',
    duree_min: 90,
    niveau: 'Débutant',
    lieu: 'Gymnase Jean-Guimier — grande salle',
  },
  {
    slug: 'combat-jeudi',
    nom: 'Combat et compétition',
    professeur: 'Marc Teyssier',
    jour: 4,
    heure: '20:00',
    duree_min: 90,
    niveau: 'Ceinture bleue et plus',
    lieu: 'Gymnase Jean-Guimier — grande salle',
  },
  {
    slug: 'poomsae-vendredi',
    nom: 'Poomsae — techniques et formes',
    professeur: 'Hélène Vasseur',
    jour: 5,
    heure: '19:00',
    duree_min: 60,
    niveau: 'Tous niveaux',
    lieu: 'Gymnase Jean-Guimier — salle 2',
  },
  {
    slug: 'preparation-passage-samedi',
    nom: 'Préparation aux passages de grade',
    professeur: 'Marc Teyssier',
    jour: 6,
    heure: '10:00',
    duree_min: 120,
    niveau: 'Sur inscription',
    lieu: 'Gymnase Jean-Guimier — grande salle',
  },
  {
    slug: 'renforcement-samedi',
    nom: 'Renforcement et souplesse',
    professeur: 'Hélène Vasseur',
    jour: 6,
    heure: '12:15',
    duree_min: 60,
    niveau: 'Tous niveaux',
    lieu: 'Gymnase Jean-Guimier — salle 2',
  },
];

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  for (const c of COURS) {
    await sql`
      INSERT INTO courses (slug, nom, professeur, jour, heure, duree_min, niveau, lieu)
      VALUES (${c.slug}, ${c.nom}, ${c.professeur}, ${c.jour}, ${c.heure},
              ${c.duree_min}, ${c.niveau}, ${c.lieu})
      ON CONFLICT (slug) DO UPDATE SET
        nom        = EXCLUDED.nom,
        professeur = EXCLUDED.professeur,
        jour       = EXCLUDED.jour,
        heure      = EXCLUDED.heure,
        duree_min  = EXCLUDED.duree_min,
        niveau     = EXCLUDED.niveau,
        lieu       = EXCLUDED.lieu
    `;
  }

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM courses`;
  console.log(`✔ Catalogue à jour : ${COURS.length} cours insérés ou mis à jour (${count} en base).`);
} catch (erreur) {
  console.error('✖ Insertion du catalogue interrompue :', erreur.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
