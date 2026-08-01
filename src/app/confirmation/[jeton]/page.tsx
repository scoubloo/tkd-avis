import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { emailTokens, users } from '@/db/schema';
import { empreinte } from '@/lib/auth/tokens';

export const metadata: Metadata = { title: 'Confirmation de votre adresse' };
export const dynamic = 'force-dynamic';

type Issue = 'confirme' | 'deja-confirme' | 'expire' | 'inconnu';

/**
 * Consomme le lien de confirmation reçu par e-mail.
 *
 * Le jeton est marqué « consommé » plutôt que supprimé : cela permet de
 * distinguer « lien déjà utilisé » (message rassurant) de « lien inconnu »
 * (message d'erreur). Sans cette nuance, un client de messagerie qui pré-charge
 * les liens ferait croire à l'utilisateur que sa confirmation a échoué.
 */
async function consommer(jeton: string): Promise<Issue> {
  const hache = empreinte(jeton);

  const lignes = await db
    .select({
      userId: emailTokens.userId,
      purpose: emailTokens.purpose,
      expiresAt: emailTokens.expiresAt,
      consumedAt: emailTokens.consumedAt,
      dejaVerifie: users.emailVerifiedAt,
    })
    .from(emailTokens)
    .innerJoin(users, eq(users.id, emailTokens.userId))
    .where(eq(emailTokens.tokenHash, hache))
    .limit(1);

  const jetonTrouve = lignes[0];
  if (!jetonTrouve || jetonTrouve.purpose !== 'confirmation') return 'inconnu';
  if (jetonTrouve.consumedAt) return jetonTrouve.dejaVerifie ? 'deja-confirme' : 'expire';
  if (jetonTrouve.expiresAt.getTime() < Date.now()) return 'expire';

  await db.transaction(async (tx) => {
    await tx
      .update(emailTokens)
      .set({ consumedAt: new Date() })
      .where(eq(emailTokens.tokenHash, hache));
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, jetonTrouve.userId));
  });

  return 'confirme';
}

export default async function PageConfirmation({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const issue = await consommer(jeton);

  return (
    <div className="etroit">
      {issue === 'confirme' && (
        <>
          <h1>Votre adresse est confirmée</h1>
          <div className="message message--succes" role="status">
            <p>Tout est en ordre. Vous pouvez maintenant vous connecter et déposer vos avis.</p>
          </div>
          <Link href="/connexion" className="bouton">
            Se connecter
          </Link>
        </>
      )}

      {issue === 'deja-confirme' && (
        <>
          <h1>C&apos;était déjà fait</h1>
          <div className="message message--info" role="status">
            <p>Cette adresse a déjà été confirmée. Il n&apos;y a rien de plus à faire.</p>
          </div>
          <Link href="/connexion" className="bouton">
            Se connecter
          </Link>
        </>
      )}

      {issue === 'expire' && (
        <>
          <h1>Ce lien n&apos;est plus valable</h1>
          <div className="message message--erreur" role="alert">
            <p>
              Un lien de confirmation est valable 24 heures et ne fonctionne qu&apos;une seule
              fois. Celui-ci a expiré ou a déjà servi.
            </p>
          </div>
          <p>
            Demandez-en un nouveau depuis la <Link href="/connexion">page de connexion</Link>.
          </p>
        </>
      )}

      {issue === 'inconnu' && (
        <>
          <h1>Lien inconnu</h1>
          <div className="message message--erreur" role="alert">
            <p>
              Ce lien ne correspond à aucune demande. Il a peut-être été coupé en deux par votre
              messagerie : vérifiez que vous l&apos;avez copié en entier.
            </p>
          </div>
          <p>
            Vous pouvez en demander un nouveau depuis la{' '}
            <Link href="/connexion">page de connexion</Link>.
          </p>
        </>
      )}
    </div>
  );
}
