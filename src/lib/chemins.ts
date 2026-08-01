/**
 * Le sous-chemin de l'application, en un seul endroit.
 *
 * ⚠️ `next/link` ajoute `basePath` tout seul. Une balise `<a href>` ordinaire,
 * un `fetch`, un `Location:` — NON. Pour ces cas-là, et uniquement ceux-là, on
 * passe par `lienBrut()`.
 *
 * Écrire « /tkd-avis/… » en dur dans une page marcherait aujourd'hui et
 * casserait le jour où le sous-chemin change, sans que rien ne le signale.
 */
export const BASE_PATH = process.env.BASE_PATH ?? '/tkd-avis';

export function lienBrut(chemin: string): string {
  if (!chemin.startsWith('/')) throw new Error('lienBrut attend un chemin absolu');
  return `${BASE_PATH}${chemin}`;
}
