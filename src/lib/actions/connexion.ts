'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { brulerDuTemps, verifierMotDePasse } from '@/lib/auth/password';
import { creerSession } from '@/lib/auth/session';
import { adresseAppelant } from '@/lib/requete-http';
import { erreur, erreursDeChamps, type EtatFormulaire } from '@/lib/formulaire';
import { consommer, delaiLisible, liberer, QUOTAS } from '@/lib/ratelimit';
import { connexionSchema, messagesDErreur } from '@/lib/validation';

/** Un seul message pour « adresse inconnue » et « mot de passe faux ». */
const IDENTIFIANTS_REFUSES = 'Adresse e-mail ou mot de passe incorrect.';

export async function connecter(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const analyse = connexionSchema.safeParse({
    email: donnees.get('email'),
    motDePasse: donnees.get('motDePasse'),
  });
  if (!analyse.success) return erreursDeChamps(messagesDErreur(analyse.error));

  const { email, motDePasse } = analyse.data;
  const ip = await adresseAppelant();

  // La clé mêle l'adresse et l'IP : bourriner un compte depuis mille machines
  // reste possible en théorie, mais chaque machine est freinée, et une seule
  // machine ne peut pas balayer mille comptes.
  const cle = `connexion:${ip}:${email}`;
  const quota = await consommer(cle, QUOTAS.connexion);
  if (!quota.autorise) {
    return erreur(
      `Trop de tentatives. Réessayez dans ${delaiLisible(quota.secondesAvantReset)}.`,
    );
  }

  const trouves = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const utilisateur = trouves[0];

  if (!utilisateur) {
    // Même coût en temps qu'une vérification réelle : sans cela, l'écart de
    // durée entre « compte inexistant » et « mauvais mot de passe » suffit à
    // énumérer les comptes au chronomètre.
    await brulerDuTemps();
    return erreur(IDENTIFIANTS_REFUSES);
  }

  if (!(await verifierMotDePasse(utilisateur.passwordHash, motDePasse))) {
    return erreur(IDENTIFIANTS_REFUSES);
  }

  if (!utilisateur.emailVerifiedAt) {
    // Ce message révèle que le compte existe — mais seulement à quelqu'un qui
    // vient de prouver qu'il connaît le mot de passe. Le compromis est assumé :
    // l'alternative serait de refuser sans dire pourquoi, et l'utilisateur
    // n'aurait aucun moyen de comprendre.
    return erreur(
      "Votre adresse n'est pas encore confirmée. Utilisez le lien reçu par e-mail à " +
        "l'inscription.",
    );
  }

  await liberer(cle);
  await creerSession(utilisateur.id);

  // Hors de tout `try` : `redirect` fonctionne en levant une exception que
  // Next.js intercepte. Placé dans un `catch`, il serait avalé.
  redirect(utilisateur.role === 'admin' ? '/admin' : '/');
}
