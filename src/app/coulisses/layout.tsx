import Link from 'next/link';

export default function CoulissesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav
        aria-label="Sections des coulisses"
        className="rangee"
        style={{ gap: '1rem', marginBottom: '1.5rem', fontSize: '.92rem' }}
      >
        <Link href="/coulisses">Le raisonnement</Link>
        <Link href="/coulisses/base">La base de données</Link>
        <Link href="/coulisses/code">Le code</Link>
        <Link href="/coulisses/preuves">Les preuves</Link>
      </nav>
      {children}
    </>
  );
}
