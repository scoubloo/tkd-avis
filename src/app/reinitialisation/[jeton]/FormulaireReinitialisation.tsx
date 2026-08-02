'use client';

import { useActionState } from 'react';
import { BoutonEnvoi, ErreurChamp, Message, estInvalide } from '@/components/Formulaire';
import { reinitialiser } from '@/lib/actions/motdepasse';
import { ETAT_INITIAL } from '@/lib/formulaire';

export function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(reinitialiser, ETAT_INITIAL);

  return (
    <form action={action} noValidate>
      {/* Le jeton voyage dans le formulaire : il n'est jamais renvoyé dans une
          URL de redirection, où il finirait dans l'historique du navigateur et
          dans l'en-tête `Referer` de la page suivante. */}
      <input type="hidden" name="jeton" value={jeton} />
      <Message etat={etat} />

      <div className="champ">
        <label className="champ__intitule" htmlFor="motDePasse">
          Nouveau mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={estInvalide(etat, 'motDePasse')}
          aria-describedby="aide-mdp"
        />
        <p className="champ__aide" id="aide-mdp">
          10 caractères minimum. Toutes vos connexions en cours seront fermées.
        </p>
        <ErreurChamp etat={etat} champ="motDePasse" />
      </div>

      <BoutonEnvoi enCours={enCours} libelleEnCours="Enregistrement…">
        Choisir ce mot de passe
      </BoutonEnvoi>
    </form>
  );
}
