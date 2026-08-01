import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lireSession } from '@/lib/auth/session';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = { title: 'Créer un compte' };

export default async function Inscription() {
  // Quelqu'un de déjà connecté n'a rien à faire ici.
  if (await lireSession()) redirect('/');

  return (
    <div className="etroit">
      <h1>Créer un compte</h1>
      <p className="chapeau">
        Une adresse e-mail et un mot de passe. Vous recevrez un lien de confirmation à ouvrir avant
        de pouvoir déposer un avis.
      </p>

      <div className="carte" style={{ marginTop: '1.5rem' }}>
        <FormulaireInscription />
      </div>

      <p style={{ marginTop: '1.25rem' }}>
        Vous avez déjà un compte ? <Link href="/connexion">Se connecter</Link>
      </p>

      <p className="champ__aide" style={{ marginTop: '1.5rem' }}>
        Votre adresse sert uniquement à confirmer votre inscription et à vous reconnecter. Elle
        n&apos;est jamais affichée en entier aux autres visiteurs et n&apos;est transmise à
        personne. Détail : <Link href="/confidentialite">données personnelles</Link>.
      </p>
    </div>
  );
}
