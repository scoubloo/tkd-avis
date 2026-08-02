'use client';

import { useActionState } from 'react';
import { BoutonEnvoi, ErreurChamp, Message, estInvalide } from '@/components/Formulaire';
import { connecter } from '@/lib/actions/connexion';
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
