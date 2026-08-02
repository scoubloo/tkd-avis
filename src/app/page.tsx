import Link from 'next/link';
import { lireSession } from '@/lib/auth/session';
import { dureeLisible, heureLisible, nomDuJour } from '@/lib/format';
import { listerCours } from '@/lib/requetes';

export default async function Accueil() {
  const [cours, utilisateur] = await Promise.all([listerCours(), lireSession()]);

  return (
    <>
      <h1>Les cours de taekwondo</h1>
      <p className="chapeau">
        Vous avez participé à l&apos;un de ces cours ? Donnez-lui une note sur 5 et quelques mots.
        Un avis par cours, modifiable à tout moment.
      </p>

      {!utilisateur && (
        <div className="message message--info" style={{ maxWidth: '44rem' }}>
          <p>
            Pour déposer un avis, <Link href="/inscription">créez un compte</Link> — il faut
            confirmer son adresse e-mail. C&apos;est ce qui évite qu&apos;une même personne note
            vingt fois le même cours.
          </p>
        </div>
      )}

      <div className="grille" style={{ marginTop: '1.5rem' }}>
        {cours.map((c) => (
          <Link key={c.id} href={`/cours/${c.slug}`} className="carte cours-carte">
            <span className="cours-carte__nom">{c.nom}</span>
            <p className="cours-carte__meta">
              {nomDuJour(c.jour)} à {heureLisible(c.heure)} · {dureeLisible(c.dureeMin)}
              <br />
              {c.professeur} · {c.niveau}
            </p>
          </Link>
        ))}
      </div>

      {cours.length === 0 && (
        <p className="vide">Aucun cours au catalogue pour le moment.</p>
      )}
    </>
  );
}
