import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lireSession } from '@/lib/auth/session';
import { DemandeRenvoi, FormulaireConnexion } from './FormulairesConnexion';

export const metadata: Metadata = { title: 'Se connecter' };

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string }>;
}) {
  if (await lireSession()) redirect('/');
  const { reinitialise } = await searchParams;

  return (
    <div className="etroit">
      <h1>Se connecter</h1>

      {reinitialise === '1' && (
        <div className="message message--succes" role="status">
          <p>
            Votre mot de passe a été changé et toutes vos connexions en cours ont été fermées.
            Connectez-vous avec le nouveau.
          </p>
        </div>
      )}

      <div className="carte" style={{ marginTop: '1.5rem' }}>
        <FormulaireConnexion />
      </div>

      <p style={{ marginTop: '1.25rem' }}>
        <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </p>

      <p>
        Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
      </p>

      <DemandeRenvoi />
    </div>
  );
}
