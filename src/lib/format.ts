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

export function dateLisible(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Masque partiellement une adresse e-mail pour l'affichage public.
 * « marie.dupont@exemple.fr » → « m•••••••••t@exemple.fr »
 */
export function emailMasque(email: string): string {
  const [local, domaine] = email.split('@');
  if (!local || !domaine) return '—';
  if (local.length <= 2) return `${local[0]}•@${domaine}`;
  return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 10))}${local.at(-1)}@${domaine}`;
}
