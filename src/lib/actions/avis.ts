'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { courses, reviews } from '@/db/schema';
import { exigerUtilisateurConfirme } from '@/lib/auth/require';
import { erreur, erreursDeChamps, succes, type EtatFormulaire } from '@/lib/formulaire';
import { avisSchema, messagesDErreur } from '@/lib/validation';

/**
 * Dépose ou met à jour l'avis de l'utilisateur connecté sur un cours.
 *
 * Un avis par personne et par cours : la contrainte d'unicité est en base, et
 * `ON CONFLICT` transforme un second dépôt en modification. Deux clics
 * simultanés ne peuvent donc pas créer deux lignes.
 *
 * ⚠️ L'autorisation est vérifiée ICI, dans l'action, et pas seulement sur la
 * page qui affiche le formulaire. Une action serveur est une URL comme une
 * autre : elle s'appelle sans jamais ouvrir la page.
 */
export async function deposerAvis(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerUtilisateurConfirme();

  const analyse = avisSchema.safeParse({
    coursId: donnees.get('coursId'),
    note: donnees.get('note'),
    commentaire: donnees.get('commentaire'),
  });
  if (!analyse.success) return erreursDeChamps(messagesDErreur(analyse.error));

  const { coursId, note, commentaire } = analyse.data;

  // Le cours doit exister ET être actif : un identifiant recopié à la main ne
  // doit pas permettre de noter un cours retiré du catalogue.
  const cours = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(and(eq(courses.id, coursId), eq(courses.actif, true)))
    .limit(1);

  const trouve = cours[0];
  if (!trouve) return erreur("Ce cours n'existe pas ou n'est plus proposé.");

  try {
    await db
      .insert(reviews)
      .values({ userId: utilisateur.id, courseId: coursId, note, commentaire })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.courseId],
        set: { note, commentaire, updatedAt: new Date() },
      });
  } catch (e) {
    console.error('[avis] échec :', e instanceof Error ? e.message : e);
    return erreur("Votre avis n'a pas pu être enregistré. Réessayez dans un instant.");
  }

  revalidatePath('/');
  revalidatePath(`/cours/${trouve.slug}`);

  return succes('Votre avis est enregistré. Vous pouvez le modifier quand vous voulez.');
}

export async function supprimerAvis(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerUtilisateurConfirme();
  const coursId = donnees.get('coursId');

  if (typeof coursId !== 'string') return erreur('Cours inconnu.');

  // La condition sur `userId` est ce qui empêche de supprimer l'avis d'autrui
  // en changeant un identifiant dans le formulaire.
  await db
    .delete(reviews)
    .where(and(eq(reviews.userId, utilisateur.id), eq(reviews.courseId, coursId)));

  revalidatePath('/');

  return succes('Votre avis a été supprimé.');
}
