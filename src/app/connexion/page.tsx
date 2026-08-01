import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lireSession } from '@/lib/auth/session';
import { DemandeRenvoi, FormulaireConnexion } from './FormulairesConnexion';

export const metadata: Metadata = { title: 'Se connecter' };

export default async function Connexion() {
  if (await lireSession()) redirect('/');

  return (
    <div className="etroit">
      <h1>Se connecter</h1>

      <div className="carte" style={{ marginTop: '1.5rem' }}>
        <FormulaireConnexion />
      </div>

      <p style={{ marginTop: '1.25rem' }}>
        Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
      </p>

      <DemandeRenvoi />
    </div>
  );
}
