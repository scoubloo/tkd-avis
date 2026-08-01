'use client';

import { useActionState, useState } from 'react';
import { BoutonEnvoi, Message } from '@/components/Formulaire';
import { supprimerMonCompte } from '@/lib/actions/compte';
import { ETAT_INITIAL } from '@/lib/formulaire';

export function SuppressionCompte() {
  const [etat, action, enCours] = useActionState(supprimerMonCompte, ETAT_INITIAL);
  const [ouvert, setOuvert] = useState(false);

  if (!ouvert) {
    return (
      <button type="button" className="bouton bouton--danger" onClick={() => setOuvert(true)}>
        Supprimer mon compte
      </button>
    );
  }

  return (
    <form action={action}>
      <Message etat={etat} />
      <p>
        La suppression est <strong>définitive</strong> : votre compte et tous vos avis
        disparaissent, et les moyennes des cours sont recalculées sans eux. Rien ne peut être
        récupéré ensuite.
      </p>
      <div className="champ">
        <label className="champ__intitule" htmlFor="confirmation">
          Écrivez SUPPRIMER pour confirmer
        </label>
        <input id="confirmation" name="confirmation" type="text" autoComplete="off" required />
      </div>
      <div className="rangee">
        <BoutonEnvoi
          enCours={enCours}
          classe="bouton bouton--danger"
          libelleEnCours="Suppression…"
        >
          Supprimer définitivement
        </BoutonEnvoi>
        <button type="button" className="bouton bouton--secondaire" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
