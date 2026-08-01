import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

/**
 * Envoi des e-mails transactionnels.
 *
 * Un seul transporteur pour tout le processus : ouvrir une connexion SMTP par
 * message ferait tomber sur les limites de Gmail en quelques minutes.
 *
 * Aucune panne muette : un échec d'envoi est journalisé avec sa cause et
 * remonté à l'appelant, qui doit le dire à l'utilisateur en français. C'est la
 * leçon des 572 échecs silencieux d'un autre chantier — un système qui échoue
 * sans le dire est un système qui ment.
 */
const global = globalThis as unknown as { __tkdMail?: Transporter };

function transporteur(): Transporter {
  if (!global.__tkdMail) {
    const c = env();
    global.__tkdMail = nodemailer.createTransport({
      host: c.SMTP_HOST,
      port: c.SMTP_PORT,
      secure: c.SMTP_PORT === 465,
      auth: { user: c.SMTP_USER, pass: c.SMTP_PASSWORD },
      pool: true,
      maxConnections: 2,
    });
  }
  return global.__tkdMail;
}

export type ResultatEnvoi = { envoye: true } | { envoye: false; raison: string };

async function envoyer(
  destinataire: string,
  sujet: string,
  texte: string,
  html: string,
): Promise<ResultatEnvoi> {
  try {
    const info = await transporteur().sendMail({
      from: env().SMTP_FROM,
      to: destinataire,
      subject: sujet,
      text: texte,
      html,
    });
    console.info(`[mail] envoyé — sujet="${sujet}" id=${info.messageId}`);
    return { envoye: true };
  } catch (erreur) {
    const raison = erreur instanceof Error ? erreur.message : String(erreur);
    // Le destinataire n'est pas journalisé : c'est une donnée personnelle et le
    // sujet suffit à diagnostiquer.
    console.error(`[mail] ÉCHEC — sujet="${sujet}" cause=${raison}`);
    return { envoye: false, raison };
  }
}

/** Gabarit commun : sobre, lisible, sans image ni pisteur. */
function gabarit(titre: string, corps: string, bouton?: { texte: string; lien: string }): string {
  const action = bouton
    ? `<p style="margin:28px 0"><a href="${bouton.lien}" style="background:#1c3f6e;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">${bouton.texte}</a></p>
       <p style="color:#555;font-size:13px;margin:0 0 8px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
       <p style="color:#555;font-size:13px;word-break:break-all;margin:0">${bouton.lien}</p>`
    : '';

  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f2;padding:24px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;padding:32px">
    <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#1c3f6e;margin:0 0 18px">Avis TKD</p>
    <h1 style="font-size:21px;margin:0 0 16px">${titre}</h1>
    ${corps}
    ${action}
    <hr style="border:none;border-top:1px solid #e6e6e2;margin:28px 0">
    <p style="color:#777;font-size:12px;margin:0">Message automatique — merci de ne pas y répondre.</p>
  </div></body></html>`;
}

export function envoyerConfirmation(destinataire: string, lien: string): Promise<ResultatEnvoi> {
  return envoyer(
    destinataire,
    'Confirmez votre adresse e-mail — Avis TKD',
    `Bonjour,

Vous venez de créer un compte sur Avis TKD. Confirmez votre adresse en ouvrant ce lien :

${lien}

Ce lien est valable 24 heures et ne fonctionne qu'une seule fois.

Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message : sans confirmation, le compte est supprimé automatiquement au bout de 7 jours.`,
    gabarit(
      'Confirmez votre adresse e-mail',
      `<p style="line-height:1.6;margin:0 0 8px">Vous venez de créer un compte sur <strong>Avis TKD</strong>. Il reste une étape.</p>
       <p style="line-height:1.6;margin:0;color:#555">Ce lien est valable <strong>24 heures</strong> et ne fonctionne <strong>qu'une seule fois</strong>.</p>`,
      { texte: 'Confirmer mon adresse', lien },
    ),
  );
}

/**
 * Envoyé quand quelqu'un tente de s'inscrire avec une adresse DÉJÀ enregistrée.
 *
 * L'inscription répond exactement la même chose dans les deux cas : sans cela,
 * le formulaire d'inscription devient un détecteur de comptes existants. Le
 * titulaire de l'adresse, lui, est prévenu.
 */
export function envoyerAlerteCompteExistant(
  destinataire: string,
  lienConnexion: string,
): Promise<ResultatEnvoi> {
  return envoyer(
    destinataire,
    'Une inscription a été tentée avec votre adresse — Avis TKD',
    `Bonjour,

Quelqu'un vient d'essayer de créer un compte Avis TKD avec cette adresse, qui en a déjà un.

Aucun nouveau compte n'a été créé et votre mot de passe n'a pas changé.

Si c'était vous, connectez-vous simplement : ${lienConnexion}
Sinon, vous pouvez ignorer ce message.`,
    gabarit(
      'Une inscription a été tentée avec votre adresse',
      `<p style="line-height:1.6;margin:0 0 8px">Cette adresse a déjà un compte. <strong>Aucun nouveau compte n'a été créé</strong> et votre mot de passe n'a pas changé.</p>
       <p style="line-height:1.6;margin:0;color:#555">Si c'était vous, connectez-vous. Sinon, ignorez ce message.</p>`,
      { texte: 'Me connecter', lien: lienConnexion },
    ),
  );
}

export function envoyerReinitialisation(destinataire: string, lien: string): Promise<ResultatEnvoi> {
  return envoyer(
    destinataire,
    'Réinitialisation de votre mot de passe — Avis TKD',
    `Bonjour,

Une réinitialisation de mot de passe a été demandée pour ce compte. Ouvrez ce lien pour choisir un nouveau mot de passe :

${lien}

Ce lien est valable 24 heures et ne fonctionne qu'une seule fois.

Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable.`,
    gabarit(
      'Choisissez un nouveau mot de passe',
      `<p style="line-height:1.6;margin:0 0 8px">Une réinitialisation a été demandée pour ce compte.</p>
       <p style="line-height:1.6;margin:0;color:#555">Lien valable <strong>24 heures</strong>, utilisable <strong>une seule fois</strong>. Si vous n'avez rien demandé, votre mot de passe actuel reste valable.</p>`,
      { texte: 'Choisir un nouveau mot de passe', lien },
    ),
  );
}

/** Vérifie que le serveur SMTP répond et accepte nos identifiants. */
export async function verifierSmtp(): Promise<ResultatEnvoi> {
  try {
    await transporteur().verify();
    return { envoye: true };
  } catch (erreur) {
    return { envoye: false, raison: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}
