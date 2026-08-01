#!/usr/bin/env node
/**
 * Donne (ou retire) le rôle d'administrateur à un compte existant.
 *
 * Il n'existe AUCUN moyen de devenir administrateur depuis le site : pas de
 * case à cocher à l'inscription, pas de code secret, pas de première-personne-
 * inscrite-devient-admin. Le seul chemin est cette commande, qui exige un accès
 * au serveur.
 *
 *   node scripts/set-admin.mjs quelquun@exemple.fr          → passe en admin
 *   node scripts/set-admin.mjs quelquun@exemple.fr --retirer → repasse en membre
 */
import postgres from 'postgres';

const email = process.argv[2];
const retirer = process.argv.includes('--retirer');

if (!email) {
  console.error('Usage : node scripts/set-admin.mjs <email> [--retirer]');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquante.');
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
const role = retirer ? 'membre' : 'admin';

try {
  const lignes = await sql`
    UPDATE users
       SET role = ${role}, updated_at = now()
     WHERE email = ${email}
    RETURNING email, role, email_verified_at
  `;

  if (lignes.length === 0) {
    console.error(`✖ Aucun compte avec l'adresse ${email}.`);
    process.exitCode = 1;
  } else {
    const u = lignes[0];
    console.log(`✔ ${u.email} → rôle « ${u.role} »`);
    if (!u.email_verified_at) {
      console.log('  ⚠️ Cette adresse n\'est pas encore confirmée : la connexion restera refusée.');
    }
  }
} catch (erreur) {
  console.error('✖ Échec :', erreur.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
