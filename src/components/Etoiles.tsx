import { noteLisible } from '@/lib/format';

/**
 * Affichage d'une note.
 *
 * Les étoiles sont décoratives (`aria-hidden`) : la valeur chiffrée est écrite
 * juste à côté, en texte. Un lecteur d'écran qui énumérerait « étoile pleine,
 * étoile pleine, étoile vide… » serait pénible et moins précis que « 3,7 sur 5 ».
 */
export function Etoiles({ valeur, taille }: { valeur: number; taille?: string }) {
  const pleines = Math.round(valeur);
  return (
    <span className="etoiles" aria-hidden="true" style={taille ? { fontSize: taille } : undefined}>
      {'★'.repeat(pleines)}
      {'☆'.repeat(Math.max(0, 5 - pleines))}
    </span>
  );
}

export function Note({ valeur, nombreAvis }: { valeur: number | null; nombreAvis: number }) {
  if (valeur === null || nombreAvis === 0) {
    return <span className="vide">Pas encore d&apos;avis</span>;
  }

  return (
    <span className="note">
      <Etoiles valeur={valeur} />
      <span className="note__valeur">{noteLisible(valeur)}</span>
      <span className="note__sur">/ 5</span>
      <span className="sr-only">
        {noteLisible(valeur)} sur 5, moyenne de {nombreAvis} avis
      </span>
    </span>
  );
}
