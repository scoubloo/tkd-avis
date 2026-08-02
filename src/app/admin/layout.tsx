import Link from 'next/link';
import { exigerAdmin } from '@/lib/auth/require';

/**
 * ⚠️ Cette garde n'est PAS la protection de l'espace d'administration : elle
 * n'est qu'un confort. Chaque page enfant appelle `exigerAdmin()` de son côté,
 * et chaque action serveur aussi.
 *
 * Un contrôle posé uniquement dans une mise en page se contourne dès qu'on
 * appelle une action serveur ou une route d'API directement, sans jamais
 * afficher la page. C'est le classique du back-office percé.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigerAdmin();

  return (
    <>
      <p className="fil">
        Administration · <Link href="/admin/utilisateurs">Utilisateurs</Link> ·{' '}
        <Link href="/admin/cours">Cours</Link>
      </p>
      {children}
    </>
  );
}
