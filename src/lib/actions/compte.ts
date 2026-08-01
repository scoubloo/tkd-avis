'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { courses, reviews, users } from '@/db/schema';
import { exigerUtilisateur } from '@/lib/auth/require';
import { detruireSession } from '@/lib/auth/session';
import { erreur, type EtatFormulaire } from '@/lib/formulaire';

/**
 * Droits RGPD implémentés comme des fonctionnalités, pas comme une adresse de
 * contact où écrire.
 *
 *  - art. 15 et 20 (accès et portabilité) : `exporterMesDonnees` ;
 *  - art. 17 (effacement) : `supprimerMonCompte`.
 *
 * Une politique de confidentialité qui promet ces droits sans les outiller
 * promet du travail manuel que personne ne fera.
 */

/**
 * Suppression définitive du compte.
 *
 * Les avis partent avec (`ON DELETE CASCADE` en base) : conserver des textes
 * rattachés à un compte supprimé serait une conservation sans base légale, et
 * les moyennes s'en trouvent recalculées automatiquement.
 */
export async function supprimerMonCompte(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerUtilisateur();

  // Confirmation explicite : on ne supprime pas un compte sur un clic malheureux.
  if (donnees.get('confirmation') !== 'SUPPRIMER') {
    return erreur('Pour confirmer, écrivez SUPPRIMER en majuscules dans le champ.');
  }

  await detruireSession();
  await db.delete(users).where(eq(users.id, utilisateur.id));

  redirect('/?compte=supprime');
}
