import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, reviews } from '@/db/schema';
import { lireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * Droit d'accès et de portabilité (RGPD art. 15 et 20).
 *
 * Rend TOUT ce que l'application détient sur la personne connectée, dans un
 * format lisible par une machine comme par un humain. Aucune demande à
 * formuler, aucun délai d'un mois : un clic.
 */
export async function GET() {
  const utilisateur = await lireSession();
  if (!utilisateur) {
    return NextResponse.json({ erreur: 'Non connecté.' }, { status: 401 });
  }

  const mesAvis = await db
    .select({
      cours: courses.nom,
      note: reviews.note,
      commentaire: reviews.commentaire,
      depose_le: reviews.createdAt,
      modifie_le: reviews.updatedAt,
    })
    .from(reviews)
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(eq(reviews.userId, utilisateur.id));

  const contenu = {
    export_effectue_le: new Date().toISOString(),
    compte: {
      email: utilisateur.email,
      role: utilisateur.role,
      inscrit_le: utilisateur.createdAt,
      adresse_confirmee_le: utilisateur.emailVerifiedAt,
    },
    mot_de_passe:
      "jamais stocké en clair — seule une empreinte argon2id existe, et elle n'est pas exportable",
    avis: mesAvis,
  };

  return new NextResponse(JSON.stringify(contenu, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mes-donnees-avis-tkd.json"',
      'Cache-Control': 'no-store',
    },
  });
}
