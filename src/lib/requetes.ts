import { and, asc, eq, sql as raw } from 'drizzle-orm';
import { db } from '@/db';
import { courses, reviews, users } from '@/db/schema';

/**
 * Les lectures de la base, regroupées.
 *
 * Aucune moyenne n'est stockée : tout se recalcule à la lecture. Un agrégat
 * dupliqué en colonne finit toujours par diverger du détail qu'il résume — et
 * personne ne s'en aperçoit avant qu'un client le remarque.
 *
 * Les moyennes sont arrondies par Postgres à une décimale et rendues en nombre :
 * `AVG` renvoie un `numeric`, que le pilote sérialise en chaîne. Sans le
 * `::float8`, on comparerait des chaînes et « 10 » serait plus petit que « 9 ».
 */

/**
 * Le catalogue, sans aucun agrégat.
 *
 * ⚠️ C'est la requête du côté PUBLIC, et la distinction n'est pas cosmétique :
 * le cahier des charges range les moyennes et les comptages sous
 * « fonctionnalité admin ». Une page publique qui appellerait
 * `listerCoursAvecNotes()` en n'affichant pas le résultat calculerait quand
 * même ce qu'elle n'a pas le droit de montrer — et le premier qui aurait
 * besoin d'un chiffre le rebrancherait sans y penser.
 */
export async function listerCours() {
  return db
    .select({
      id: courses.id,
      slug: courses.slug,
      nom: courses.nom,
      professeur: courses.professeur,
      jour: courses.jour,
      heure: courses.heure,
      dureeMin: courses.dureeMin,
      niveau: courses.niveau,
      lieu: courses.lieu,
    })
    .from(courses)
    .where(eq(courses.actif, true))
    .orderBy(asc(courses.jour), asc(courses.heure));
}

export async function trouverCoursParSlug(slug: string) {
  const lignes = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return lignes[0] ?? null;
}

export type AvisAffiche = {
  id: string;
  note: number;
  commentaire: string;
  createdAt: Date;
  auteurEmail: string;
};

export async function trouverAvisDe(userId: string, coursId: string) {
  const lignes = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.courseId, coursId)))
    .limit(1);
  return lignes[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Back-office — moyennes, comptages et avis d'autrui vivent ICI et nulle part */
/*  ailleurs. C'est la seule règle métier que le cahier des charges énonce.     */
/* -------------------------------------------------------------------------- */

export type CoursAvecNotes = {
  id: string;
  slug: string;
  nom: string;
  professeur: string;
  jour: number;
  heure: string;
  dureeMin: number;
  niveau: string;
  lieu: string;
  nombreAvis: number;
  moyenne: number | null;
};

export async function listerCoursAvecNotes(): Promise<CoursAvecNotes[]> {
  const lignes = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      nom: courses.nom,
      professeur: courses.professeur,
      jour: courses.jour,
      heure: courses.heure,
      dureeMin: courses.dureeMin,
      niveau: courses.niveau,
      lieu: courses.lieu,
      nombreAvis: raw<number>`count(${reviews.id})::int`,
      moyenne: raw<number | null>`round(avg(${reviews.note}), 1)::float8`,
    })
    .from(courses)
    .leftJoin(reviews, eq(reviews.courseId, courses.id))
    .where(eq(courses.actif, true))
    .groupBy(courses.id)
    .orderBy(asc(courses.jour), asc(courses.heure));

  return lignes;
}

export async function listerAvisDuCours(coursId: string): Promise<AvisAffiche[]> {
  return db
    .select({
      id: reviews.id,
      note: reviews.note,
      commentaire: reviews.commentaire,
      createdAt: reviews.createdAt,
      auteurEmail: users.email,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.courseId, coursId))
    .orderBy(raw`${reviews.updatedAt} DESC`);
}

export type LigneUtilisateur = {
  id: string;
  email: string;
  role: string;
  confirme: boolean;
  inscritLe: Date;
  coursNotes: number;
  moyenneDonnee: number | null;
};

export async function listerUtilisateurs(): Promise<LigneUtilisateur[]> {
  const lignes = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      inscritLe: users.createdAt,
      coursNotes: raw<number>`count(${reviews.id})::int`,
      moyenneDonnee: raw<number | null>`round(avg(${reviews.note}), 1)::float8`,
    })
    .from(users)
    .leftJoin(reviews, eq(reviews.userId, users.id))
    .groupBy(users.id)
    .orderBy(raw`count(${reviews.id}) DESC, ${users.createdAt} DESC`);

  return lignes.map((l) => ({
    id: l.id,
    email: l.email,
    role: l.role,
    confirme: l.emailVerifiedAt !== null,
    inscritLe: l.inscritLe,
    coursNotes: l.coursNotes,
    moyenneDonnee: l.moyenneDonnee,
  }));
}
