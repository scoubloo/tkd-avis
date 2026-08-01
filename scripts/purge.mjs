#!/usr/bin/env node
/**
 * Ménage périodique — lancé par une tâche planifiée sur le serveur.
 *
 * Ce n'est pas du confort : la durée de conservation annoncée sur la page
 * « Données personnelles » n'est tenue que si quelque chose l'applique
 * réellement. Une politique de confidentialité qui promet une suppression que
 * personne n'exécute est une déclaration fausse.
 *
 *   - comptes jamais confirmés au bout de 7 jours → supprimés (avec leurs jetons) ;
 *   - sessions expirées → supprimées ;
 *   - jetons e-mail expirés ou consommés depuis plus de 7 jours → supprimés ;
 *   - compteurs anti-abus périmés → supprimés.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquante.');
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const comptes = await sql`
    DELETE FROM users
     WHERE email_verified_at IS NULL
       AND created_at < now() - interval '7 days'
    RETURNING id
  `;

  const sessions = await sql`
    DELETE FROM sessions WHERE expires_at < now() RETURNING token_hash
  `;

  const jetons = await sql`
    DELETE FROM email_tokens
     WHERE expires_at < now() - interval '7 days'
        OR consumed_at < now() - interval '7 days'
    RETURNING token_hash
  `;

  const compteurs = await sql`
    DELETE FROM rate_limits WHERE fenetre_fin < now() - interval '1 hour' RETURNING cle
  `;

  console.log(
    `✔ Ménage : ${comptes.length} compte(s) non confirmé(s), ${sessions.length} session(s) ` +
      `expirée(s), ${jetons.length} jeton(s), ${compteurs.length} compteur(s).`,
  );
} catch (erreur) {
  console.error('✖ Ménage interrompu :', erreur.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
