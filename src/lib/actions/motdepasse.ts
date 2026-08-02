'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emailTokens, users } from '@/db/schema';
import { hacherMotDePasse } from '@/lib/auth/password';
import { detruireToutesLesSessions } from '@/lib/auth/session';
import { creerJeton, dansMs, empreinte, DUREE_JETON_EMAIL_MS } from '@/lib/auth/tokens';
import { env } from '@/lib/env';
import { erreur, erreursDeChamps, succes, type EtatFormulaire } from '@/lib/formulaire';
import { envoyerReinitialisation } from '@/lib/mail';
import { consommer, delaiLisible, QUOTAS } from '@/lib/ratelimit';
import { adresseAppelant } from '@/lib/requete-http';
import { emailSchema, messagesDErreur, reinitialisationSchema } from '@/lib/validation';

/**
 * Réinitialisation du mot de passe.
 *
 * Même règle que partout ailleurs : la réponse est **identique** que l'adresse
 * existe ou non. Un formulaire « mot de passe oublié » qui répond « adresse
 * inconnue » est un détecteur de comptes offert à qui veut.
 */
const MESSAGE_NEUTRE =
  'Si un compte existe pour cette adresse, un e-mail vient de partir. Le lien est valable 24 heures.';

export async function demanderReinitialisation(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const analyse = emailSchema.safeParse(donnees.get('email'));
  if (!analyse.success) return erreur('Cette adresse e-mail ne semble pas valide.');

  const email = analyse.data;
  const ip = await adresseAppelant();
  const quota = await consommer(`oubli:${ip}`, QUOTAS.motDePasseOublie);
  if (!quota.autorise) {
    return erreur(`Trop de demandes. Réessayez dans ${delaiLisible(quota.secondesAvantReset)}.`);
  }

  const trouves = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const utilisateur = trouves[0];
  if (!utilisateur) return succes(MESSAGE_NEUTRE);

  // Un seul lien vivant à la fois : les précédents sont invalidés.
  await db
    .delete(emailTokens)
    .where(and(eq(emailTokens.userId, utilisateur.id), eq(emailTokens.purpose, 'reinitialisation')));

  const jeton = creerJeton();
  await db.insert(emailTokens).values({
    tokenHash: empreinte(jeton),
    userId: utilisateur.id,
    purpose: 'reinitialisation',
    expiresAt: dansMs(DUREE_JETON_EMAIL_MS),
  });

  const envoi = await envoyerReinitialisation(email, `${env().PUBLIC_URL}/reinitialisation/${jeton}`);
  if (!envoi.envoye) {
    // Panne muette interdite, même ici : l'utilisateur doit savoir maintenant
    // que l'e-mail n'est pas parti, pas l'apprendre en attendant pour rien.
    return erreur("L'e-mail n'a pas pu partir. Réessayez dans quelques minutes.");
  }

  return succes(MESSAGE_NEUTRE);
}

export type EtatJeton = 'valide' | 'expire' | 'inconnu';

/** Vérifie un jeton SANS le consommer — pour décider quoi afficher. */
export async function etatDuJeton(jeton: string): Promise<EtatJeton> {
  const lignes = await db
    .select({ expiresAt: emailTokens.expiresAt, consumedAt: emailTokens.consumedAt })
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, empreinte(jeton)), eq(emailTokens.purpose, 'reinitialisation')))
    .limit(1);

  const trouve = lignes[0];
  if (!trouve) return 'inconnu';
  if (trouve.consumedAt) return 'expire';
  if (trouve.expiresAt.getTime() < Date.now()) return 'expire';
  return 'valide';
}

export async function reinitialiser(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const jeton = donnees.get('jeton');
  if (typeof jeton !== 'string' || jeton.length === 0) return erreur('Lien invalide.');

  const analyse = reinitialisationSchema.safeParse({ motDePasse: donnees.get('motDePasse') });
  if (!analyse.success) return erreursDeChamps(messagesDErreur(analyse.error));

  const hache = empreinte(jeton);

  // On ne consomme le jeton QUE s'il est encore vierge, dans la même
  // instruction : deux envois simultanés ne peuvent pas réinitialiser deux fois.
  const consommes = await db
    .update(emailTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailTokens.tokenHash, hache),
        eq(emailTokens.purpose, 'reinitialisation'),
        isNull(emailTokens.consumedAt),
      ),
    )
    .returning({ userId: emailTokens.userId, expiresAt: emailTokens.expiresAt });

  const consomme = consommes[0];
  if (!consomme) return erreur('Ce lien a déjà servi ou n’est pas valide. Demandez-en un nouveau.');
  if (consomme.expiresAt.getTime() < Date.now()) {
    return erreur('Ce lien a expiré. Demandez-en un nouveau.');
  }

  const passwordHash = await hacherMotDePasse(analyse.data.motDePasse);

  await db
    .update(users)
    .set({
      passwordHash,
      // Recevoir cet e-mail prouve que l'adresse appartient bien à la personne :
      // un compte jamais confirmé le devient ici, sinon il resterait bloqué
      // dans une impasse — mot de passe changé, mais connexion toujours refusée.
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, consomme.userId));

  // ⚠️ Toutes les sessions ouvertes sont détruites. Quelqu'un qui change son
  // mot de passe le fait souvent parce qu'il craint que quelqu'un d'autre y ait
  // accès : laisser vivre les sessions existantes viderait le geste de son sens.
  await detruireToutesLesSessions(consomme.userId);

  redirect('/connexion?reinitialise=1');
}
