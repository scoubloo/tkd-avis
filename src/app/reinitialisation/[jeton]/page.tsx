import type { Metadata } from 'next';
import Link from 'next/link';
import { etatDuJeton } from '@/lib/actions/motdepasse';
import { FormulaireReinitialisation } from './FormulaireReinitialisation';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };
export const dynamic = 'force-dynamic';

export default async function PageReinitialisation({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  // Le jeton est VÉRIFIÉ sans être consommé : ouvrir la page ne doit pas brûler
  // le lien. Il n'est consommé qu'au moment où un nouveau mot de passe est
  // réellement choisi — sinon un client de messagerie qui pré-charge les liens
  // invaliderait la demande avant même que la personne ait cliqué.
  const etat = await etatDuJeton(jeton);

  if (etat !== 'valide') {
    return (
      <div className="etroit">
        <h1>{etat === 'expire' ? "Ce lien n'est plus valable" : 'Lien inconnu'}</h1>
        <div className="message message--erreur" role="alert">
          <p>
            {etat === 'expire'
              ? 'Un lien de réinitialisation est valable 24 heures et ne fonctionne qu’une seule fois.'
              : 'Ce lien ne correspond à aucune demande. Il a peut-être été coupé en deux par votre messagerie.'}
          </p>
        </div>
        <Link href="/mot-de-passe-oublie" className="bouton">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="etroit">
      <h1>Choisissez un nouveau mot de passe</h1>
      <div className="carte" style={{ marginTop: '1.5rem' }}>
        <FormulaireReinitialisation jeton={jeton} />
      </div>
    </div>
  );
}
