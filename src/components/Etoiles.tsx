/**
 * Affichage d'une note, réservé au back-office.
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
