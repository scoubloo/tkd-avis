import { sql } from '@/db';

/**
 * Limitation de débit à fenêtre fixe, stockée en base.
 *
 * En base et non en mémoire, pour deux raisons :
 *  - un redémarrage du conteneur ne doit pas remettre les compteurs à zéro et
 *    rouvrir la porte au bourrinage ;
 *  - le compteur reste juste si l'application tourne un jour en plusieurs
 *    exemplaires.
 *
 * L'incrémentation et la lecture se font dans UNE seule instruction SQL : deux
 * requêtes simultanées ne peuvent pas lire le même compteur et l'écraser
 * mutuellement.
 */
export type Quota = { limite: number; fenetreMs: number };

export const QUOTAS = {
  connexion: { limite: 5, fenetreMs: 15 * 60 * 1000 },
  inscription: { limite: 3, fenetreMs: 60 * 60 * 1000 },
  renvoiEmail: { limite: 3, fenetreMs: 60 * 60 * 1000 },
  motDePasseOublie: { limite: 3, fenetreMs: 60 * 60 * 1000 },
} as const satisfies Record<string, Quota>;

export type Resultat = { autorise: boolean; restant: number; secondesAvantReset: number };

export async function consommer(cle: string, quota: Quota): Promise<Resultat> {
  const lignes = await sql<{ compteur: number; fenetre_fin: Date }[]>`
    INSERT INTO rate_limits (cle, compteur, fenetre_fin)
    VALUES (${cle}, 1, now() + ${`${quota.fenetreMs} milliseconds`}::interval)
    ON CONFLICT (cle) DO UPDATE SET
      compteur = CASE
                   WHEN rate_limits.fenetre_fin < now() THEN 1
                   ELSE rate_limits.compteur + 1
                 END,
      fenetre_fin = CASE
                      WHEN rate_limits.fenetre_fin < now()
                        THEN now() + ${`${quota.fenetreMs} milliseconds`}::interval
                      ELSE rate_limits.fenetre_fin
                    END
    RETURNING compteur, fenetre_fin
  `;

  const ligne = lignes[0];
  if (!ligne) return { autorise: true, restant: quota.limite - 1, secondesAvantReset: 0 };

  const secondes = Math.max(0, Math.ceil((ligne.fenetre_fin.getTime() - Date.now()) / 1000));
  return {
    autorise: ligne.compteur <= quota.limite,
    restant: Math.max(0, quota.limite - ligne.compteur),
    secondesAvantReset: secondes,
  };
}

/** Remet un compteur à zéro — après une connexion réussie, par exemple. */
export async function liberer(cle: string): Promise<void> {
  await sql`DELETE FROM rate_limits WHERE cle = ${cle}`;
}

export function delaiLisible(secondes: number): string {
  if (secondes < 60) return `${secondes} seconde${secondes > 1 ? 's' : ''}`;
  const minutes = Math.ceil(secondes / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
