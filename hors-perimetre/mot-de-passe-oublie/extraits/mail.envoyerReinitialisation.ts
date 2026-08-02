// Extrait de `src/lib/mail.ts`, retiré le 02/08/2026.
// À recoller tel quel dans ce fichier, après `envoyerAlerteCompteExistant`.
// Il s'appuie sur `envoyer()` et `gabarit()`, qui sont restés en place.

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
