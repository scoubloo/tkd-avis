// Extrait de `src/lib/actions/connexion.ts`, retiré le 02/08/2026.
//
// Le cahier des charges demande « confirmation du mail », pas un second envoi
// quand le premier se perd. Le code est gardé ici pour la même raison que le
// mot de passe oublié : s'il est redemandé, il n'y a rien à réécrire.
//
// Pour le rebrancher :
//   1. recoller cette fonction à la fin de `src/lib/actions/connexion.ts` ;
//   2. y rétablir les imports : `emailTokens` (@/db/schema), `creerJeton`,
//      `dansMs`, `empreinte`, `DUREE_JETON_EMAIL_MS` (@/lib/auth/tokens),
//      `env` (@/lib/env), `envoyerConfirmation` (@/lib/mail), `succes`
//      (@/lib/formulaire), `emailSchema` (@/lib/validation) ;
//   3. remettre le composant `DemandeRenvoi` (voir FormulairesConnexion.tsx
//      dans l'historique git, commit précédant le retrait) et son appel dans
//      `src/app/connexion/page.tsx` ;
//   4. `QUOTAS.renvoiEmail` est resté en place dans `src/lib/ratelimit.ts`.

/** Renvoie un e-mail de confirmation. Réponse neutre dans tous les cas. */
export async function renvoyerConfirmation(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const analyse = emailSchema.safeParse(donnees.get('email'));
  if (!analyse.success) return erreur('Cette adresse e-mail ne semble pas valide.');

  const email = analyse.data;
  const ip = await adresseAppelant();
  const quota = await consommer(`renvoi:${ip}`, QUOTAS.renvoiEmail);
  if (!quota.autorise) {
    return erreur(`Trop de demandes. Réessayez dans ${delaiLisible(quota.secondesAvantReset)}.`);
  }

  const message = "Si un compte non confirmé existe pour cette adresse, un e-mail vient de partir.";

  const trouves = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const utilisateur = trouves[0];
  if (!utilisateur || utilisateur.emailVerifiedAt) return succes(message);

  // Les jetons de confirmation précédents sont invalidés : un seul lien vivant
  // à la fois, c'est un lien de moins qui traîne dans une boîte mail.
  await db.delete(emailTokens).where(eq(emailTokens.userId, utilisateur.id));

  const jeton = creerJeton();
  await db.insert(emailTokens).values({
    tokenHash: empreinte(jeton),
    userId: utilisateur.id,
    purpose: 'confirmation',
    expiresAt: dansMs(DUREE_JETON_EMAIL_MS),
  });

  const envoi = await envoyerConfirmation(email, `${env().PUBLIC_URL}/confirmation/${jeton}`);
  if (!envoi.envoye) {
    return erreur("L'e-mail n'a pas pu partir. Réessayez dans quelques minutes.");
  }

  return succes(message);
}
