import type { Metadata } from 'next';
import Link from 'next/link';
import { lireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Adresse à confirmer' };

export default async function EnAttente() {
  const utilisateur = await lireSession();

  return (
    <div className="etroit">
      <h1>Il reste à confirmer votre adresse</h1>
      <div className="message message--info" role="status">
        <p>
          Un e-mail a été envoyé{utilisateur ? ` à ${utilisateur.email}` : ''}. Ouvrez-le et cliquez
          sur le lien : tant que ce n&apos;est pas fait, vous ne pouvez pas déposer d&apos;avis.
        </p>
      </div>
      <p>
        Rien reçu ? Regardez dans les indésirables, puis demandez un nouvel envoi depuis la{' '}
        <Link href="/connexion">page de connexion</Link>.
      </p>
      <Link href="/" className="bouton bouton--secondaire">
        Revenir aux cours
      </Link>
    </div>
  );
}
