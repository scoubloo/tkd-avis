import type { Metadata } from 'next';
import Link from 'next/link';
import { exigerAdmin } from '@/lib/auth/require';
import { noteLisible } from '@/lib/format';
import { statistiques } from '@/lib/requetes';

export const metadata: Metadata = { title: 'Administration' };

export default async function TableauDeBord() {
  await exigerAdmin();
  const s = await statistiques();

  const cases = [
    { intitule: 'Comptes créés', valeur: String(s.utilisateurs) },
    { intitule: 'Adresses confirmées', valeur: String(s.confirmes) },
    { intitule: 'Cours au catalogue', valeur: String(s.cours) },
    { intitule: 'Avis déposés', valeur: String(s.avis) },
    { intitule: 'Moyenne générale', valeur: s.avis > 0 ? `${noteLisible(s.moyenneGlobale)} / 5` : '—' },
  ];

  return (
    <>
      <h1>Administration</h1>

      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))' }}>
        {cases.map((c) => (
          <div key={c.intitule} className="carte">
            <p className="compte-avis" style={{ margin: 0 }}>{c.intitule}</p>
            <p style={{ margin: '.2rem 0 0', fontSize: '1.7rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {c.valeur}
            </p>
          </div>
        ))}
      </div>

      <div className="rangee" style={{ marginTop: '2rem' }}>
        <Link href="/admin/utilisateurs" className="bouton">
          Liste des utilisateurs
        </Link>
        <Link href="/admin/cours" className="bouton bouton--secondaire">
          Liste des cours
        </Link>
      </div>
    </>
  );
}
