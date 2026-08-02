import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { lireSession } from '@/lib/auth/session';
import { deconnexion } from '@/lib/actions/deconnexion';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Avis TKD — avis sur les cours de taekwondo', template: '%s — Avis TKD' },
  description:
    'Donnez votre avis sur les cours de taekwondo auxquels vous avez participé : une note sur 5 et quelques mots.',
  // Application de démonstration : elle n'a rien à faire dans un moteur de recherche.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1c3f6e',
};

// Chaque page dépend de la session : aucun rendu ne doit être mis en cache.
export const dynamic = 'force-dynamic';

export default async function RacineLayout({ children }: { children: React.ReactNode }) {
  const utilisateur = await lireSession();

  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="sr-only">
          Aller au contenu
        </a>

        <header className="entete">
          <div className="enveloppe entete__contenu">
            <Link href="/" className="marque">
              Avis<span>TKD</span>
            </Link>

            <nav className="nav" aria-label="Navigation principale">
              <Link href="/">Les cours</Link>

              {utilisateur ? (
                <>
                  {utilisateur.role === 'admin' && <Link href="/admin">Administration</Link>}
                  <Link href="/mon-compte">Mon compte</Link>
                  <form action={deconnexion}>
                    <button
                      type="submit"
                      className="bouton bouton--secondaire"
                      style={{ padding: '.35rem .8rem', minHeight: 'auto', fontSize: '.88rem' }}
                    >
                      Se déconnecter
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/connexion">Se connecter</Link>
                  <Link
                    href="/inscription"
                    className="bouton"
                    style={{ padding: '.35rem .9rem', minHeight: 'auto', fontSize: '.88rem' }}
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main id="contenu">
          <div className="enveloppe">{children}</div>
        </main>

        <footer className="pied">
          <div className="enveloppe">
            <ul>
              <li>
                <Link href="/mentions-legales">Mentions légales</Link>
              </li>
              <li>
                <Link href="/confidentialite">Données personnelles</Link>
              </li>
              <li>
                <Link href="/coulisses">
                  <strong>Coulisses</strong> — le code, la base, les preuves
                </Link>
              </li>
            </ul>
            <p style={{ margin: 0 }}>
              Application de démonstration. Les cours et les professeurs présentés sont fictifs.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
