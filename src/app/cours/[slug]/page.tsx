import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Etoiles, Note } from '@/components/Etoiles';
import { lireSession } from '@/lib/auth/session';
import {
  accord,
  dateLisible,
  dureeLisible,
  auteurPublic,
  heureLisible,
  moyenne,
  nomDuJour,
} from '@/lib/format';
import { listerAvisDuCours, trouverAvisDe, trouverCoursParSlug } from '@/lib/requetes';
import { FormulaireAvis } from './FormulaireAvis';

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

  const [avis, utilisateur] = await Promise.all([listerAvisDuCours(cours.id), lireSession()]);
  const monAvis = utilisateur ? await trouverAvisDe(utilisateur.id, cours.id) : null;
  const note = moyenne(avis.map((a) => a.note));

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
        <p style={{ margin: '.9rem 0 0' }}>
          <Note valeur={note} nombreAvis={avis.length} />
          {avis.length > 0 && (
            <span className="compte-avis"> — {avis.length} {accord(avis.length, 'avis', 'avis')}</span>
          )}
        </p>
      </div>

      <section aria-labelledby="titre-formulaire" style={{ marginBottom: '2.5rem' }}>
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
              l&apos;inscription. <Link href="/connexion">Demander un nouvel envoi</Link>.
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

      <section aria-labelledby="titre-avis">
        <h2 id="titre-avis">
          {avis.length === 0
            ? 'Aucun avis pour le moment'
            : `${avis.length} ${accord(avis.length, 'avis', 'avis')}`}
        </h2>

        {avis.length === 0 && (
          <p className="vide">Ce cours n&apos;a pas encore été noté. Vous pouvez être la première personne à le faire.</p>
        )}

        <div className="pile moyen">
          {avis.map((a) => (
            <article key={a.id} className="carte">
              <div className="rangee" style={{ justifyContent: 'space-between' }}>
                <span className="rangee" style={{ gap: '.5rem' }}>
                  <Etoiles valeur={a.note} />
                  <strong>{a.note}/5</strong>
                  {utilisateur?.id === a.auteurId && (
                    <span className="etiquette etiquette--admin">votre avis</span>
                  )}
                </span>
                <span className="compte-avis">{dateLisible(a.updatedAt)}</span>
              </div>
              <p style={{ margin: '.7rem 0 .4rem', whiteSpace: 'pre-wrap' }}>{a.commentaire}</p>
              {/* Aucune adresse e-mail n'est publiée, même masquée : le service
                  n'en a pas besoin pour fonctionner. */}
              <p className="compte-avis" style={{ margin: 0 }}>
                {auteurPublic()}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
