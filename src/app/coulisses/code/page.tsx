import type { Metadata } from 'next';
import Link from 'next/link';
import { listerFichiers, lireFichier, parDossier } from '@/lib/source';

export const metadata: Metadata = { title: 'Le code' };
export const dynamic = 'force-dynamic';

export default async function Code({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const fichiers = await listerFichiers();
  const contenu = f ? await lireFichier(f) : null;
  const groupes = parDossier(fichiers);
  const totalLignes = fichiers.reduce((s, x) => s + x.lignes, 0);

  return (
    <div>
      <p className="fil">
        <Link href="/coulisses">Coulisses</Link> › Le code
        {f && (
          <>
            {' '}› <code>{f}</code>
          </>
        )}
      </p>

      <h1>Le code</h1>
      <p className="chapeau">
        {fichiers.length} fichiers, {totalLignes.toLocaleString('fr-FR')} lignes. Ce ne sont pas des
        copies : <strong>ces fichiers sont ceux que le serveur exécute</strong>, embarqués depuis
        l&apos;étape de construction. Impossible de montrer une chose et d&apos;en exécuter une autre.
      </p>

      {contenu !== null && f ? (
        <>
          <div className="rangee" style={{ marginBottom: '1rem' }}>
            <Link href="/coulisses/code" className="bouton bouton--secondaire">
              ← Tous les fichiers
            </Link>
            <span className="compte-avis">{contenu.split('\n').length} lignes</span>
          </div>

          <div className="tableau-cadre" style={{ padding: 0 }}>
            <pre
              style={{
                margin: 0,
                padding: '1rem',
                overflowX: 'auto',
                fontSize: '.8rem',
                lineHeight: 1.55,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                tabSize: 2,
              }}
            >
              <code>
                {contenu.split('\n').map((ligne, i) => (
                  <span key={i} style={{ display: 'block' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        width: '3.2em',
                        color: 'var(--encre-tres-douce)',
                        userSelect: 'none',
                      }}
                    >
                      {i + 1}
                    </span>
                    {ligne}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </>
      ) : (
        <>
          {f && (
            <div className="message message--erreur" role="alert">
              <p>Ce fichier n&apos;est pas consultable.</p>
            </div>
          )}
          {[...groupes.entries()].map(([dossier, liste]) => (
            <section key={dossier} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontFamily: 'ui-monospace, monospace' }}>{dossier}</h2>
              <div className="tableau-cadre">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Fichier</th>
                      <th scope="col" className="nombre">Lignes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liste.map((x) => (
                      <tr key={x.chemin}>
                        <td>
                          <Link
                            href={`/coulisses/code?f=${encodeURIComponent(x.chemin)}`}
                            style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.85rem' }}
                          >
                            {x.chemin}
                          </Link>
                        </td>
                        <td className="nombre">{x.lignes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
