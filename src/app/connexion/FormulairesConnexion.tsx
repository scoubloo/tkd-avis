'use client';

import { useActionState, useState } from 'react';
import { BoutonEnvoi, ErreurChamp, Message, estInvalide } from '@/components/Formulaire';
import { connecter, renvoyerConfirmation } from '@/lib/actions/connexion';
import { ETAT_INITIAL } from '@/lib/formulaire';

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(connecter, ETAT_INITIAL);

  return (
    <form action={action} noValidate>
      <Message etat={etat} />

      <div className="champ">
        <label className="champ__intitule" htmlFor="email">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={estInvalide(etat, 'email')}
        />
        <ErreurChamp etat={etat} champ="email" />
      </div>

      <div className="champ">
        <label className="champ__intitule" htmlFor="motDePasse">
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={estInvalide(etat, 'motDePasse')}
        />
        <ErreurChamp etat={etat} champ="motDePasse" />
      </div>

      <BoutonEnvoi enCours={enCours} libelleEnCours="Connexion…">
        Se connecter
      </BoutonEnvoi>
    </form>
  );
}

/** Repliée par défaut : elle ne sert qu'aux personnes bloquées. */
export function DemandeRenvoi() {
  const [etat, action, enCours] = useActionState(renvoyerConfirmation, ETAT_INITIAL);
  const [ouvert, setOuvert] = useState(false);

  if (!ouvert) {
    return (
      <button
        type="button"
        className="bouton bouton--secondaire"
        onClick={() => setOuvert(true)}
        style={{ marginTop: '1rem' }}
      >
        Je n&apos;ai pas reçu l&apos;e-mail de confirmation
      </button>
    );
  }

  return (
    <form action={action} className="carte" style={{ marginTop: '1rem' }} noValidate>
      <h2 style={{ fontSize: '1rem' }}>Recevoir un nouveau lien de confirmation</h2>
      <Message etat={etat} />
      <div className="champ">
        <label className="champ__intitule" htmlFor="email-renvoi">
          Votre adresse e-mail
        </label>
        <input id="email-renvoi" name="email" type="email" autoComplete="email" required />
      </div>
      <BoutonEnvoi enCours={enCours} classe="bouton bouton--secondaire">
        Envoyer un nouveau lien
      </BoutonEnvoi>
    </form>
  );
}
