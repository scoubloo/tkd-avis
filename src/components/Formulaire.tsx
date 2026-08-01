'use client';

import type { EtatFormulaire } from '@/lib/formulaire';

/**
 * Retour visible de chaque formulaire.
 *
 * `role="alert"` fait annoncer le message par les lecteurs d'écran dès son
 * apparition : sans cela, une personne non voyante remplit un formulaire, le
 * valide, et ne sait pas ce qui s'est passé.
 */
export function Message({ etat }: { etat: EtatFormulaire }) {
  if (etat.statut === 'initial') return null;
  if (etat.statut === 'erreur' && !etat.message) return null;

  const classe = etat.statut === 'succes' ? 'message message--succes' : 'message message--erreur';
  const texte = etat.statut === 'succes' ? etat.message : etat.message;

  return (
    <div className={classe} role="alert">
      <p>{texte}</p>
    </div>
  );
}

/** Message d'erreur attaché à un champ précis. */
export function ErreurChamp({ etat, champ }: { etat: EtatFormulaire; champ: string }) {
  if (etat.statut !== 'erreur' || !etat.champs?.[champ]) return null;
  return (
    <p className="erreur-champ" id={`erreur-${champ}`}>
      {etat.champs[champ]}
    </p>
  );
}

export function estInvalide(etat: EtatFormulaire, champ: string): boolean {
  return etat.statut === 'erreur' && Boolean(etat.champs?.[champ]);
}

/**
 * Bouton d'envoi qui se désactive pendant le traitement.
 *
 * Sans cette désactivation, un double clic envoie deux fois le formulaire — et
 * c'est exactement ce que fait quelqu'un quand rien ne bouge à l'écran.
 */
export function BoutonEnvoi({
  enCours,
  children,
  libelleEnCours = 'Envoi…',
  classe = 'bouton',
}: {
  enCours: boolean;
  children: React.ReactNode;
  libelleEnCours?: string;
  classe?: string;
}) {
  return (
    <button type="submit" className={classe} disabled={enCours} aria-busy={enCours}>
      {enCours ? libelleEnCours : children}
    </button>
  );
}
