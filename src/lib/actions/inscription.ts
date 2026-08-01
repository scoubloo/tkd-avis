'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { emailTokens, users } from '@/db/schema';
import { hacherMotDePasse } from '@/lib/auth/password';
import { creerJeton, dansMs, empreinte, DUREE_JETON_EMAIL_MS } from '@/lib/auth/tokens';
import { env } from '@/lib/env';
import { adresseAppelant } from '@/lib/requete-http';
import {
  erreur,
  erreursDeChamps,
  succes,
  type EtatFormulaire,
} from '@/lib/formulaire';
import { envoyerAlerteCompteExistant, envoyerConfirmation } from '@/lib/mail';
import { consommer, delaiLisible, QUOTAS } from '@/lib/ratelimit';
import { inscriptionSchema, messagesDErreur } from '@/lib/validation';

/**
 * Le même message est renvoyé que l'adresse existe déjà ou non.
 *
 * Sans cela, le formulaire d'inscription devient un détecteur de comptes : on
 * saisit mille adresses, on note celles qui répondent « déjà utilisée », et on
 * obtient la liste des inscrits — utile pour cibler du hameçonnage.
 * Le titulaire de l'adresse, lui, reçoit un e-mail l'avertissant de la tentative.
 */
const MESSAGE_NEUTRE =
  'Un e-mail vient de partir. Ouvrez-le et cliquez sur le lien pour confirmer votre adresse. Il est valable 24 heures.';

export async function inscrire(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const ip = await adresseAppelant();
  const quota = await consommer(`inscription:${ip}`, QUOTAS.inscription);
  if (!quota.autorise) {
    return erreur(
      `Trop d'inscriptions depuis cet appareil. Réessayez dans ${delaiLisible(quota.secondesAvantReset)}.`,
    );
  }

  const analyse = inscriptionSchema.safeParse({
    email: donnees.get('email'),
    motDePasse: donnees.get('motDePasse'),
  });
  if (!analyse.success) return erreursDeChamps(messagesDErreur(analyse.error));

  const { email, motDePasse } = analyse.data;
  const lienConnexion = `${env().PUBLIC_URL}/connexion`;

  const existants = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existants.length > 0) {
    // Réponse identique au cas nominal, mais on prévient le vrai titulaire.
    await envoyerAlerteCompteExistant(email, lienConnexion);
    return succes(MESSAGE_NEUTRE);
  }

  const passwordHash = await hacherMotDePasse(motDePasse);
  const jeton = creerJeton();

  try {
    await db.transaction(async (tx) => {
      const [cree] = await tx.insert(users).values({ email, passwordHash }).returning({ id: users.id });
      if (!cree) throw new Error('création du compte impossible');

      await tx.insert(emailTokens).values({
        tokenHash: empreinte(jeton),
        userId: cree.id,
        purpose: 'confirmation',
        expiresAt: dansMs(DUREE_JETON_EMAIL_MS),
      });
    });
  } catch (e) {
    // Course entre deux inscriptions simultanées sur la même adresse : la
    // contrainte d'unicité tranche, et on répond comme si de rien n'était.
    const message = e instanceof Error ? e.message : '';
    if (message.includes('users_email_key') || message.includes('duplicate key')) {
      return succes(MESSAGE_NEUTRE);
    }
    console.error('[inscription] échec :', message);
    return erreur("La création du compte a échoué. Réessayez dans un instant.");
  }

  const envoi = await envoyerConfirmation(email, `${env().PUBLIC_URL}/confirmation/${jeton}`);

  if (!envoi.envoye) {
    // Panne muette interdite : le compte existe, l'e-mail n'est pas parti, et
    // l'utilisateur doit l'apprendre maintenant — pas en attendant un message
    // qui n'arrivera jamais.
    return erreur(
      "Votre compte est créé mais l'e-mail de confirmation n'a pas pu partir. " +
        'Allez sur la page de connexion et demandez un nouvel envoi.',
    );
  }

  return succes(MESSAGE_NEUTRE);
}
