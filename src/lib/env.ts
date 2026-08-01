import { z } from 'zod';

/**
 * La configuration est validée AU DÉMARRAGE, pas au premier usage.
 *
 * Une variable manquante doit faire échouer le lancement du conteneur avec un
 * message clair, jamais produire une panne silencieuse trois heures plus tard
 * au moment où quelqu'un attend son e-mail de confirmation.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  PUBLIC_URL: z
    .string()
    .url('PUBLIC_URL doit être une URL complète, sous-chemin compris')
    // Les liens de confirmation sont construits par concaténation : une barre
    // finale produirait « //confirmation ».
    .refine((v) => !v.endsWith('/'), 'PUBLIC_URL ne doit pas finir par une barre oblique'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

let cache: z.infer<typeof schema> | null = null;

export function env(): z.infer<typeof schema> {
  if (cache) return cache;

  const resultat = schema.safeParse(process.env);
  if (!resultat.success) {
    const details = resultat.error.issues
      .map((i) => `  - ${i.path.join('.')} : ${i.message}`)
      .join('\n');
    throw new Error(`Configuration invalide :\n${details}`);
  }

  cache = resultat.data;
  return cache;
}

export const estProduction = () => process.env.NODE_ENV === 'production';
