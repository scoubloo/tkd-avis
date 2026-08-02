import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Etoiles } from '@/components/Etoiles';
import { exigerAdmin } from '@/lib/auth/require';
import {
  accord,
  dateLisible,
  dureeLisible,
  heureLisible,
  moyenne,
  nomDuJour,
  noteLisible,
} from '@/lib/format';
import { listerAvisDuCours, trouverCoursParSlug } from '@/lib/requetes';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cours = await trouverCoursParSlug(slug);
  return { title: cours ? `${cours.nom} — fiche` : 'Cours introuvable' };
}

export default async function FicheCours({ params }: { params: Promise<{ slug: string }> }) {
  await exigerAdmin();

  const { slug } = await params;
  const cours = await trouverCoursParSlug(slug);
  if (!cours) notFound();

  const avis = await listerAvisDuCours(cours.id);
  const note = moyenne(avis.map((a) => a.note));

  return (
    <>
      <p className="fil">
        <Link href="/admin/cours">Cours</Link> › {cours.nom}
      </p>

      <h1>{cours.nom}</h1>

      <div className="carte moyen">
        <p style={{ margin: 0 }}>
          {nomDuJour(cours.jour)} à {heureLisible(cours.heure)} · {dureeLisible(cours.dureeMin)}
          <br />
          {cours.professeur} · {cours.niveau} · {cours.lieu}
        </p>
        <p style={{ margin: '.8rem 0 0', fontSize: '1.1rem' }}>
          <strong>
            {avis.length} {accord(avis.length, 'note', 'notes')}
          </strong>
          {avis.length > 0 && <> — moyenne <strong>{noteLisible(note)} / 5</strong></>}
        </p>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Les avis, un par un</h2>

      {avis.length === 0 ? (
        <p className="vide">Ce cours n&apos;a encore reçu aucun avis.</p>
      ) : (
        <div className="tableau-cadre">
          <table>
            <thead>
              <tr>
                <th scope="col">Auteur</th>
                <th scope="col" className="nombre">Note</th>
                <th scope="col">Description</th>
                <th scope="col">Déposé le</th>
              </tr>
            </thead>
            <tbody>
              {avis.map((a) => (
                <tr key={a.id}>
                  <th scope="row" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0 }}>
                    {a.auteurEmail}
                  </th>
                  <td className="nombre">
                    <span className="rangee" style={{ gap: '.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <Etoiles valeur={a.note} />
                      <strong>{a.note}</strong>
                    </span>
                  </td>
                  <td className="libre" style={{ whiteSpace: 'pre-wrap' }}>
                    {a.commentaire}
                  </td>
                  <td>{dateLisible(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
