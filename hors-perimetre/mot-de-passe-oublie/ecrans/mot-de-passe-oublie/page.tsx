import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireOubli } from './FormulaireOubli';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function MotDePasseOublie() {
  return (
    <div className="etroit">
      <h1>Mot de passe oublié</h1>
      <p className="chapeau">
        Indiquez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.
      </p>

      <div className="carte" style={{ marginTop: '1.5rem' }}>
        <FormulaireOubli />
      </div>

      <p style={{ marginTop: '1.25rem' }}>
        <Link href="/connexion">Revenir à la connexion</Link>
      </p>
    </div>
  );
}
