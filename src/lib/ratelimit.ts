import { createHash } from 'node:crypto';
import { sql } from '@/db';

/**
 * La clé est CONDENSÉE avant d'entrer en base.
 *
 * Les appelants construisent des clés lisibles du genre
 * `connexion:88.12.4.7:marie@exemple.fr` — ce qui mettait une adresse e-mail et
 * une adresse IP en clair dans une table, sans que ce soit annoncé nulle part,
 * et sans qu'un effacement de compte les emporte. Le compteur fonctionne
 * exactement pareil sur une empreinte, et la donnée personnelle disparaît du
 * schéma.
 */
function condenser(cle: string): string {
  return createHash('sha256').update(cle).digest('hex');
}

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
  const empreinte = condenser(cle);
  // ⚠️ Le délai restant est calculé PAR PostgreSQL et rendu en entier.
  // Première version : la colonne `fenetre_fin` était rapatriée telle quelle et
  // `.getTime()` appelé dessus — le pilote la rendait en chaîne, et
  // l'inscription tombait en erreur 500 au tout premier essai. Faire calculer
  // la base supprime la dépendance à sa façon de convertir les dates, et
  // supprime aussi tout écart d'horloge entre le serveur web et la base.
  const lignes = await sql<{ compteur: number; secondes_restantes: number }[]>`
    INSERT INTO rate_limits (cle, compteur, fenetre_fin)
    VALUES (${empreinte}, 1, now() + ${`${quota.fenetreMs} milliseconds`}::interval)
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
    RETURNING compteur,
              GREATEST(0, CEIL(EXTRACT(EPOCH FROM (fenetre_fin - now()))))::int
                AS secondes_restantes
  `;

  const ligne = lignes[0];
  // Une limitation de débit qui ne sait pas répondre laisse passer : elle
  // protège du bourrinage, elle ne doit jamais bloquer un site entier.
  if (!ligne) return { autorise: true, restant: quota.limite - 1, secondesAvantReset: 0 };

  return {
    autorise: ligne.compteur <= quota.limite,
    restant: Math.max(0, quota.limite - ligne.compteur),
    secondesAvantReset: ligne.secondes_restantes,
  };
}

/** Remet un compteur à zéro — après une connexion réussie, par exemple. */
export async function liberer(cle: string): Promise<void> {
  await sql`DELETE FROM rate_limits WHERE cle = ${condenser(cle)}`;
}

export function delaiLisible(secondes: number): string {
  if (secondes < 60) return `${secondes} seconde${secondes > 1 ? 's' : ''}`;
  const minutes = Math.ceil(secondes / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
