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

/**
 * Mode « capture », pour les tests de bout en bout uniquement.
 *
 * Les jetons de confirmation ne sont stockés que sous forme d'empreinte : un
 * test ne peut donc PAS reconstruire le lien depuis la base — c'est la
 * contrepartie normale d'un stockage correct. Il faut donc lire le message.
 *
 * ⚠️ Double verrou : il faut `SMTP_HOST=capture` **ET** `MODE_TEST=1`. Deux
 * interrupteurs indépendants, dont AUCUN n'existe dans la configuration de
 * production : un serveur réel ne peut pas basculer silencieusement dans un
 * mode où les e-mails ne partent plus.
 *
 * Le verrou s'appuyait d'abord sur `NODE_ENV !== 'production'`. C'était une
 * erreur de conception : elle interdisait de faire tourner les tests contre une
 * VRAIE construction de production — donc de tester ce qu'on livre réellement.
 * Et ça se paie : en mode développement, `redirect('/')` d'une action serveur
 * perd le sous-chemin, ce qu'on ne voit jamais en production.
 */
function captureActive(): boolean {
  return env().SMTP_HOST === 'capture' && process.env.MODE_TEST === '1';
}

function transporteur(): Transporter {
  if (!global.__tkdMail) {
    const c = env();

    if (captureActive()) {
      console.warn('[mail] MODE CAPTURE — aucun e-mail ne part réellement.');
      global.__tkdMail = nodemailer.createTransport({ jsonTransport: true });
      return global.__tkdMail;
    }

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

    if (captureActive()) {
      // Le message complet est déposé dans un fichier que les tests lisent
      // pour en extraire le lien de confirmation.
      const { appendFile } = await import('node:fs/promises');
      const fichier = process.env.CAPTURE_MAIL_FICHIER ?? '/tmp/tkd-avis-mails.jsonl';
      await appendFile(fichier, `${JSON.stringify({ destinataire, sujet, texte })}\n`);
      console.info(`[mail] capturé dans ${fichier} — sujet="${sujet}"`);
      return { envoye: true };
    }

    console.info(`[mail] envoyé — sujet="${sujet}" id=${info.messageId}`);
    return { envoye: true };
  } catch (erreur) {
    const raison = erreur instanceof Error ? erreur.message : String(erreur);
    // ⚠️ Le message brut du serveur SMTP est journalisé sous forme de CODE
    // seulement. Un refus Gmail ressemble à « 550 5.1.1 <victime@exemple.fr>
    // The email account that you tried to reach does not exist » : journaliser
    // `raison` telle quelle écrivait donc l'adresse du destinataire dans les
    // journaux, alors que le commentaire d'à côté affirmait le contraire.
    const code = /\b([245]\d{2})\b/.exec(raison)?.[1] ?? 'inconnu';
    const type = erreur instanceof Error ? erreur.name : 'Erreur';
    console.error(`[mail] ÉCHEC — sujet="${sujet}" type=${type} code=${code}`);
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

/** Vérifie que le serveur SMTP répond et accepte nos identifiants. */
export async function verifierSmtp(): Promise<ResultatEnvoi> {
  try {
    await transporteur().verify();
    return { envoye: true };
  } catch (erreur) {
    return { envoye: false, raison: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}
