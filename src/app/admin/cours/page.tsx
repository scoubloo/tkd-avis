import type { Metadata } from 'next';
import Link from 'next/link';
import { exigerAdmin } from '@/lib/auth/require';
import { heureLisible, nomDuJour, noteLisible } from '@/lib/format';
import { listerCoursAvecNotes } from '@/lib/requetes';

export const metadata: Metadata = { title: 'Cours' };

export default async function CoursAdmin() {
  await exigerAdmin();
  const cours = await listerCoursAvecNotes();
  const total = cours.reduce((somme, c) => somme + c.nombreAvis, 0);

  return (
    <>
      <h1>Cours</h1>
      <p className="chapeau">
        {cours.length} cours au catalogue, {total} avis au total. Cliquez sur un cours pour lire le
        détail des notes et des commentaires.
      </p>

      <div className="tableau-cadre" style={{ marginTop: '1.5rem' }}>
        <table>
          <caption>Un cours sans aucune note affiche « — » : une moyenne de zéro le ferait passer pour mauvais alors qu&apos;il n&apos;est que nouveau.</caption>
          <thead>
            <tr>
              <th scope="col">Cours</th>
              <th scope="col">Créneau</th>
              <th scope="col">Professeur</th>
              <th scope="col" className="nombre">Notes</th>
              <th scope="col" className="nombre">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {cours.map((c) => (
              <tr key={c.id}>
                <th scope="row" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0 }}>
                  <Link href={`/admin/cours/${c.slug}`}>{c.nom}</Link>
                </th>
                <td>
                  {nomDuJour(c.jour)} {heureLisible(c.heure)}
                </td>
                <td>{c.professeur}</td>
                <td className="nombre">{c.nombreAvis}</td>
                <td className="nombre">{c.nombreAvis > 0 ? noteLisible(c.moyenne) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
