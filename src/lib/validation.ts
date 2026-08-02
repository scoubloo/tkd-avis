import { z } from 'zod';

/**
 * Toute donnée qui entre est validée ICI, côté serveur.
 *
 * Les contrôles du navigateur (`required`, `maxlength`, `type="email"`) sont un
 * confort d'usage, pas une protection : ils sont retirés en trois secondes avec
 * les outils de développement, et n'existent pas du tout quand la requête est
 * fabriquée à la main.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Indiquez votre adresse e-mail.')
  .max(254, 'Cette adresse est trop longue.')
  .email('Cette adresse e-mail ne semble pas valide.')
  .transform((v) => v.toLowerCase());

/**
 * Politique de mot de passe alignée sur le NIST SP 800-63B : la longueur est ce
 * qui compte. On n'impose ni majuscule ni caractère spécial — ces règles
 * produisent surtout des « Password1! » notés sur un papier.
 */
export const motDePasseSchema = z
  .string()
  .min(10, 'Votre mot de passe doit faire au moins 10 caractères.')
  .max(200, 'Votre mot de passe ne peut pas dépasser 200 caractères.');

export const inscriptionSchema = z.object({
  email: emailSchema,
  motDePasse: motDePasseSchema,
});

export const connexionSchema = z.object({
  email: emailSchema,
  // Pas de contrainte de longueur à la connexion : un ancien mot de passe court
  // doit pouvoir se présenter pour être rejeté par la vérification, pas par la
  // validation de forme (qui révélerait la politique en vigueur à l'époque).
  motDePasse: z.string().min(1, 'Indiquez votre mot de passe.').max(200),
});

export const avisSchema = z.object({
  coursId: z.string().uuid('Cours inconnu.'),
  note: z.coerce
    .number()
    .int('La note doit être un nombre entier.')
    .min(1, 'La note va de 1 à 5.')
    .max(5, 'La note va de 1 à 5.'),
  commentaire: z
    .string()
    .trim()
    .min(10, 'Votre avis doit faire au moins 10 caractères.')
    .max(2000, 'Votre avis ne peut pas dépasser 2000 caractères.'),
});

export type DonneesAvis = z.infer<typeof avisSchema>;

/** Transforme une erreur Zod en dictionnaire champ → premier message. */
export function messagesDErreur(erreur: z.ZodError): Record<string, string> {
  const sortie: Record<string, string> = {};
  for (const probleme of erreur.issues) {
    const champ = probleme.path[0];
    if (typeof champ === 'string' && !(champ in sortie)) {
      sortie[champ] = probleme.message;
    }
  }
  return sortie;
}
