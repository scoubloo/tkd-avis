// Extrait de `src/lib/validation.ts`, retiré le 02/08/2026.
// À recoller tel quel dans ce fichier, après `connexionSchema`.

/**
 * Schéma du formulaire de réinitialisation.
 *
 * C'est un OBJET et non un simple `motDePasseSchema` : validé seul, une chaîne
 * produit une erreur dont le chemin est vide — le message n'aurait donc pu être
 * rattaché à aucun champ, et l'utilisateur aurait vu un formulaire refusé sans
 * la moindre explication.
 */
export const reinitialisationSchema = z.object({
  motDePasse: motDePasseSchema,
});
