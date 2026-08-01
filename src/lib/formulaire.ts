/**
 * Types et fabriques d'état partagés entre le serveur et le navigateur.
 *
 * ⚠️ Ce fichier est importé par des composants client : il ne doit contenir
 * AUCUNE dépendance serveur (`next/headers`, accès base, secrets). La lecture
 * de la requête HTTP vit dans `requete-http.ts`, qui reste côté serveur.
 */

/** État renvoyé par toutes les actions de formulaire, consommé par `useActionState`. */
export type EtatFormulaire =
  | { statut: 'initial' }
  | { statut: 'erreur'; message?: string; champs?: Record<string, string> }
  | { statut: 'succes'; message: string };

export const ETAT_INITIAL: EtatFormulaire = { statut: 'initial' };

export function erreur(message: string): EtatFormulaire {
  return { statut: 'erreur', message };
}

export function erreursDeChamps(champs: Record<string, string>): EtatFormulaire {
  return { statut: 'erreur', champs };
}

export function succes(message: string): EtatFormulaire {
  return { statut: 'succes', message };
}
