/**
 * Fonctions pures d'affichage — sans base, sans réseau, donc directement
 * testables. Tout ce qui se calcule ici est vérifié dans `tests/unit/`.
 */

const JOURS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;

/** 1 = lundi … 7 = dimanche (norme ISO-8601). */
export function nomDuJour(jour: number): string {
  return JOURS[jour - 1] ?? '—';
}

/** « 19:30:00 » → « 19 h 30 » ; « 14:00:00 » → « 14 h ». */
export function heureLisible(heure: string): string {
  const [h, m] = heure.split(':');
  if (!h) return heure;
  const minutes = m && m !== '00' ? ` ${m}` : '';
  return `${Number(h)} h${minutes}`;
}

export function dureeLisible(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${h} h` : `${h} h ${reste}`;
}

/**
 * Moyenne arrondie à une décimale.
 *
 * Rend `null` quand il n'y a aucune note : afficher « 0 » pour un cours jamais
 * noté le ferait passer pour mauvais alors qu'il n'est que nouveau.
 */
export function moyenne(notes: readonly number[]): number | null {
  if (notes.length === 0) return null;
  const somme = notes.reduce((total, n) => total + n, 0);
  return Math.round((somme / notes.length) * 10) / 10;
}

/** « 3.7 » → « 3,7 » : en français la virgule est le séparateur décimal. */
export function noteLisible(valeur: number | null): string {
  if (valeur === null) return '—';
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function accord(n: number, singulier: string, pluriel = `${singulier}s`): string {
  return n <= 1 ? singulier : pluriel;
}

/**
 * ⚠️ Le fuseau est imposé, il n'est pas hérité de la machine.
 *
 * Le serveur tourne en UTC : sans cette précision, un avis déposé à 1 h du
 * matin heure de Paris s'affichait daté de la VEILLE. Le défaut n'apparaît
 * qu'entre minuit et 2 h — donc jamais pendant qu'on développe, et toujours
 * chez l'utilisateur.
 */
export function dateLisible(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });
}

/**
 * Étiquette publique de l'auteur d'un avis.
 *
 * ⚠️ Une version précédente affichait l'adresse partiellement masquée
 * (« m•••••••t@exemple.fr »). C'était la mauvaise réponse à la bonne question :
 * le masque conservait la première lettre, la dernière et le DOMAINE ENTIER,
 * ce qui reste ré-identifiant sur une petite base — et surtout, rien dans le
 * service n'exige d'afficher une adresse.
 *
 * Le principe de minimisation ne demande pas de mieux masquer une donnée
 * inutile : il demande de ne pas la publier.
 */
export function auteurPublic(): string {
  return 'Membre';
}
