'use client';

import { useActionState } from 'react';
import { BoutonEnvoi, Message } from '@/components/Formulaire';
import { demanderReinitialisation } from '@/lib/actions/motdepasse';
import { ETAT_INITIAL } from '@/lib/formulaire';

export function FormulaireOubli() {
  const [etat, action, enCours] = useActionState(demanderReinitialisation, ETAT_INITIAL);

  if (etat.statut === 'succes') {
    return (
      <>
        <Message etat={etat} />
        <p style={{ marginBottom: 0 }}>
          Rien reçu au bout de quelques minutes ? Regardez dans les indésirables.
        </p>
      </>
    );
  }

  return (
    <form action={action} noValidate>
      <Message etat={etat} />
      <div className="champ">
        <label className="champ__intitule" htmlFor="email">
          Votre adresse e-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <BoutonEnvoi enCours={enCours} libelleEnCours="Envoi…">
        Recevoir un lien
      </BoutonEnvoi>
    </form>
  );
}
