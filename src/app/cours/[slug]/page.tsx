import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { lireSession } from '@/lib/auth/session';
import { dureeLisible, heureLisible, nomDuJour } from '@/lib/format';
import { trouverAvisDe, trouverCoursParSlug } from '@/lib/requetes';
import { FormulaireAvis } from './FormulaireAvis';

/**
 * Page publique d'un cours.
 *
 * ⚠️ Elle ne montre NI la moyenne, NI le nombre d'avis, NI les avis des autres.
 * Le cahier des charges range ces trois choses sous « fonctionnalité admin » ;
 * les afficher ici déplacerait une capacité d'un rôle vers l'autre. Côté
 * utilisateur, l'énoncé ne demande qu'une chose : pouvoir saisir son avis.
 *
 * Le sien lui reste visible — c'est le formulaire lui-même, pré-rempli, qui le
 * porte : sans ça, « modifiable à tout moment » ne veut plus rien dire.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cours = await trouverCoursParSlug(slug);
  return { title: cours?.nom ?? 'Cours introuvable' };
}

export default async function PageCours({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cours = await trouverCoursParSlug(slug);
  if (!cours) notFound();

  const utilisateur = await lireSession();
  const monAvis = utilisateur ? await trouverAvisDe(utilisateur.id, cours.id) : null;

  return (
    <>
      <p className="fil">
        <Link href="/">Les cours</Link> › {cours.nom}
      </p>

      <h1>{cours.nom}</h1>

      <div className="carte moyen" style={{ marginBottom: '2rem' }}>
        <p style={{ margin: 0 }}>
          <strong>{nomDuJour(cours.jour)}</strong> à {heureLisible(cours.heure)} ·{' '}
          {dureeLisible(cours.dureeMin)}
          <br />
          Animé par {cours.professeur} · {cours.niveau}
          <br />
          {cours.lieu}
        </p>
      </div>

      <section aria-labelledby="titre-formulaire">
        <h2 id="titre-formulaire">{monAvis ? 'Votre avis' : 'Donner votre avis'}</h2>

        {!utilisateur && (
          <div className="message message--info moyen">
            <p>
              <Link href="/connexion">Connectez-vous</Link> ou{' '}
              <Link href="/inscription">créez un compte</Link> pour donner votre avis sur ce cours.
            </p>
          </div>
        )}

        {utilisateur && !utilisateur.emailVerifiedAt && (
          <div className="message message--info moyen">
            <p>
              Confirmez d&apos;abord votre adresse e-mail — le lien vous a été envoyé à
              l&apos;inscription.
            </p>
          </div>
        )}

        {utilisateur && utilisateur.emailVerifiedAt && (
          <div className="carte moyen">
            <FormulaireAvis
              coursId={cours.id}
              avisExistant={monAvis ? { note: monAvis.note, commentaire: monAvis.commentaire } : null}
            />
          </div>
        )}
      </section>
    </>
  );
}
