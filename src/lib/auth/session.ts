import { cookies } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { sessions, users, type Utilisateur } from '@/db/schema';
import { creerJeton, dansMs, empreinte, DUREE_SESSION_MS } from './tokens';
import { estProduction } from '@/lib/env';

/**
 * Le cookie est limité au sous-chemin de l'application.
 *
 * L'hôte `n8n.srv1314704.hstgr.cloud` sert aussi sept autres démonstrations :
 * un cookie posé sur « / » serait envoyé à toutes, et apparaîtrait dans leurs
 * journaux d'accès. `HttpOnly` interdit sa lecture par du JavaScript, `Lax`
 * empêche son envoi depuis un site tiers, et `Secure` sa circulation en clair.
 */
const CHEMIN = process.env.BASE_PATH ?? '/tkd-avis';
const NOM_COOKIE = estProduction() ? '__Secure-tkd_session' : 'tkd_session';

export async function creerSession(userId: string): Promise<void> {
  const jeton = creerJeton();
  const expiration = dansMs(DUREE_SESSION_MS);

  await db.insert(sessions).values({
    tokenHash: empreinte(jeton),
    userId,
    expiresAt: expiration,
  });

  (await cookies()).set(NOM_COOKIE, jeton, {
    httpOnly: true,
    sameSite: 'lax',
    secure: estProduction(),
    path: CHEMIN,
    expires: expiration,
  });
}

/**
 * Rend l'utilisateur connecté, ou `null`.
 *
 * Ne modifie RIEN : cette fonction est appelée pendant le rendu de composants
 * serveur, où l'écriture d'un cookie est interdite par Next.js. Le nettoyage
 * des sessions périmées est le travail de `scripts/purge.mjs`.
 */
export async function lireSession(): Promise<Utilisateur | null> {
  const jeton = (await cookies()).get(NOM_COOKIE)?.value;
  if (!jeton) return null;

  const lignes = await db
    .select({ utilisateur: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, empreinte(jeton)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return lignes[0]?.utilisateur ?? null;
}

export async function detruireSession(): Promise<void> {
  const magasin = await cookies();
  const jeton = magasin.get(NOM_COOKIE)?.value;

  if (jeton) {
    // La session est retirée de la base : effacer le cookie seul laisserait un
    // jeton valide en circulation, réutilisable par qui l'aurait intercepté.
    await db.delete(sessions).where(eq(sessions.tokenHash, empreinte(jeton)));
  }

  magasin.set(NOM_COOKIE, '', { path: CHEMIN, maxAge: 0 });
}

/** Invalide toutes les sessions d'un compte (changement de mot de passe). */
export async function detruireToutesLesSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
