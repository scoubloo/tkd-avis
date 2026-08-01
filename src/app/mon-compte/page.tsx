import type { Metadata } from 'next';
import Link from 'next/link';
import { Etoiles } from '@/components/Etoiles';
import { exigerUtilisateur } from '@/lib/auth/require';
import { lienBrut } from '@/lib/chemins';
import { accord, dateLisible } from '@/lib/format';
import { listerMesAvis } from '@/lib/requetes';
import { SuppressionCompte } from './SuppressionCompte';

export const metadata: Metadata = { title: 'Mon compte' };

export default async function MonCompte() {
  const utilisateur = await exigerUtilisateur();
  const mesAvis = await listerMesAvis(utilisateur.id);

  return (
    <div className="moyen">
      <h1>Mon compte</h1>

      <div className="carte">
        <p style={{ margin: 0 }}>
          <strong>{utilisateur.email}</strong>
          {utilisateur.role === 'admin' && (
            <> <span className="etiquette etiquette--admin">administrateur</span></>
          )}
          {!utilisateur.emailVerifiedAt && (
            <> <span className="etiquette etiquette--attente">adresse non confirmée</span></>
          )}
        </p>
        <p className="compte-avis" style={{ margin: '.4rem 0 0' }}>
          Inscrit le {dateLisible(utilisateur.createdAt)}
        </p>
      </div>

      <h2 style={{ marginTop: '2rem' }}>
        {mesAvis.length === 0
          ? 'Vous n’avez pas encore donné d’avis'
          : `Mes avis (${mesAvis.length} ${accord(mesAvis.length, 'cours', 'cours')})`}
      </h2>

      {mesAvis.length === 0 ? (
        <p>
          <Link href="/">Choisissez un cours</Link> auquel vous avez participé pour lui donner une
          note.
        </p>
      ) : (
        <div className="pile">
          {mesAvis.map((a) => (
            <article key={a.id} className="carte">
              <div className="rangee" style={{ justifyContent: 'space-between' }}>
                <Link href={`/cours/${a.coursSlug}`} style={{ fontWeight: 650 }}>
                  {a.coursNom}
                </Link>
                <span className="rangee" style={{ gap: '.4rem' }}>
                  <Etoiles valeur={a.note} />
                  <strong>{a.note}/5</strong>
                </span>
              </div>
              <p style={{ margin: '.6rem 0 .3rem', whiteSpace: 'pre-wrap' }}>{a.commentaire}</p>
              <p className="compte-avis" style={{ margin: 0 }}>
                Modifié le {dateLisible(a.updatedAt)}
              </p>
            </article>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '2.5rem' }}>Mes données</h2>
      <p>
        Vous pouvez récupérer tout ce que cette application détient sur vous, ou tout effacer. Ces
        deux droits sont ici des boutons, pas une adresse à qui écrire.
      </p>
      <div className="rangee">
        <a href={lienBrut('/api/mes-donnees')} className="bouton bouton--secondaire" download>
          Télécharger mes données
        </a>
      </div>

      <div className="carte" style={{ marginTop: '1.5rem', borderColor: '#e4c0bd' }}>
        <SuppressionCompte />
      </div>
    </div>
  );
}
