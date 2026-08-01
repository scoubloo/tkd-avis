import Link from 'next/link';

export default function Introuvable() {
  return (
    <div className="etroit">
      <h1>Page introuvable</h1>
      <p className="chapeau">
        Cette adresse ne correspond à rien. Le lien est peut-être ancien, ou coupé en deux par une
        messagerie.
      </p>
      <Link href="/" className="bouton">
        Revenir aux cours
      </Link>
    </div>
  );
}
