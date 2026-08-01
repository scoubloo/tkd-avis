import 'server-only';
import { headers } from 'next/headers';

/**
 * Lecture de la requête HTTP entrante. Serveur uniquement.
 *
 * L'import `server-only` est une garde active : si un composant client importe
 * ce fichier par inadvertance, la construction échoue avec un message explicite
 * au lieu de laisser fuir du code serveur dans le navigateur.
 */

/**
 * Adresse de l'appelant, pour la limitation de débit.
 *
 * L'application est derrière Traefik : `x-forwarded-for` contient la chaîne des
 * intermédiaires, et **seule la première valeur** est celle du client. Un client
 * peut fabriquer son propre en-tête, mais Traefik l'écrase — la valeur est donc
 * fiable ici, et le serait beaucoup moins sans reverse proxy devant.
 *
 * Retourne « inconnu » plutôt que de lever : une limitation de débit qui plante
 * ouvrirait la porte au lieu de la fermer.
 */
export async function adresseAppelant(): Promise<string> {
  try {
    const entetes = await headers();
    const chaine = entetes.get('x-forwarded-for');
    const premiere = chaine?.split(',')[0]?.trim();
    return premiere || entetes.get('x-real-ip') || 'inconnu';
  } catch {
    return 'inconnu';
  }
}
