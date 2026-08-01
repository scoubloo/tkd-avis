#!/usr/bin/env node
/**
 * Applique les migrations SQL de db/migrations/ dans l'ordre des noms de fichier.
 *
 * Écrit en JavaScript pur et sans dépendance de compilation : ce script doit
 * pouvoir tourner dans le conteneur de production, où il n'y a ni TypeScript
 * ni outillage de développement.
 *
 * Propriétés tenues :
 *  - idempotent : une migration déjà appliquée est ignorée (table schema_migrations) ;
 *  - atomique par migration : une migration qui échoue à la moitié est annulée
 *    en entier, la base ne reste jamais dans un état intermédiaire ;
 *  - vérifié : l'empreinte SHA-256 du fichier est enregistrée. Modifier après
 *    coup une migration déjà appliquée fait échouer le script au lieu de laisser
 *    diverger silencieusement le code et la base.
 */
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const ici = dirname(fileURLToPath(import.meta.url));
const dossierMigrations = join(ici, '..', 'db', 'migrations');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquante.');
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nom         text PRIMARY KEY,
      empreinte   text NOT NULL,
      applique_le timestamptz NOT NULL DEFAULT now()
    )
  `;

  // ⚠️ Le filtre `._` n'est pas décoratif : macOS crée des fichiers frères
  // « ._nom.sql » (163 octets binaires) que `tar` emporte volontiers vers le
  // serveur. Ils se terminent par « .sql », et ils se trient AVANT la vraie
  // migration — le script envoyait donc du binaire à PostgreSQL, qui répondait
  // « invalid message format », un message qui ne désigne rien. Une heure de
  // diagnostic pour un caractère.
  const fichiers = (await readdir(dossierMigrations))
    .filter((f) => f.endsWith('.sql') && !f.startsWith('._'))
    .sort();
  const deja = new Map(
    (await sql`SELECT nom, empreinte FROM schema_migrations`).map((r) => [r.nom, r.empreinte]),
  );

  let appliquees = 0;

  for (const fichier of fichiers) {
    const contenu = await readFile(join(dossierMigrations, fichier), 'utf8');
    const empreinte = createHash('sha256').update(contenu).digest('hex');

    const connue = deja.get(fichier);
    if (connue) {
      if (connue !== empreinte) {
        console.error(
          `\n✖ La migration ${fichier} a été MODIFIÉE après avoir été appliquée.\n` +
            `  Empreinte en base : ${connue}\n` +
            `  Empreinte du fichier : ${empreinte}\n` +
            `  Une migration appliquée est figée : il faut en écrire une nouvelle.\n`,
        );
        process.exit(1);
      }
      continue;
    }

    // La migration ET son enregistrement partent en UNE SEULE requête, en
    // protocole simple, encadrée par un BEGIN/COMMIT explicite.
    //
    // ⚠️ Deux pièges, tous les deux payés en vrai sur ce projet :
    //
    //  1. le protocole ÉTENDU (celui utilisé par défaut) n'accepte qu'une
    //     instruction par requête — un fichier de migration en contient dix ;
    //     d'où `.simple()` ;
    //
    //  2. mais on ne peut pas ENCHAÎNER une requête simple et une requête
    //     paramétrée sur la même connexion : le flux de messages se
    //     désynchronise et PostgreSQL répond `08P01 invalid message format`,
    //     un message qui ne désigne pas du tout la vraie cause. C'est pourquoi
    //     l'INSERT est concaténé au SQL au lieu d'être une requête à part.
    //
    // Les deux valeurs interpolées sont maîtrisées (un nom de fichier lu sur le
    // disque, une empreinte hexadécimale), et les apostrophes sont doublées par
    // sécurité — le protocole simple n'a pas de paramètres.
    const echapper = (v) => String(v).replaceAll("'", "''");
    const bloc = [
      'BEGIN;',
      contenu,
      `INSERT INTO schema_migrations (nom, empreinte) VALUES ('${echapper(fichier)}', '${echapper(empreinte)}');`,
      'COMMIT;',
    ].join('\n');

    await sql.unsafe(bloc).simple();

    console.log(`✔ ${fichier} appliquée`);
    appliquees += 1;
  }

  console.log(
    appliquees === 0
      ? `Base déjà à jour (${fichiers.length} migration(s) connue(s)).`
      : `${appliquees} migration(s) appliquée(s).`,
  );
} catch (erreur) {
  // Un message de panne doit permettre de réparer sans relancer une enquête :
  // le code PostgreSQL, la position dans le SQL et la trace valent dix fois
  // « invalid message format » tout seul.
  console.error('✖ Migration interrompue');
  console.error(`  message  : ${erreur.message}`);
  if (erreur.code) console.error(`  code     : ${erreur.code}`);
  if (erreur.position) console.error(`  position : caractère ${erreur.position}`);
  if (erreur.detail) console.error(`  détail   : ${erreur.detail}`);
  console.error(erreur.stack);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
