'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { BoutonEnvoi, ErreurChamp, Message, estInvalide } from '@/components/Formulaire';
import { inscrire } from '@/lib/actions/inscription';
import { ETAT_INITIAL } from '@/lib/formulaire';

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState(inscrire, ETAT_INITIAL);

  // Après un envoi réussi, le formulaire disparaît : le laisser affiché
  // inviterait à recommencer alors que l'étape suivante est dans la boîte mail.
  if (etat.statut === 'succes') {
    return (
      <>
        <Message etat={etat} />
        <p>
          Vous ne trouvez pas l&apos;e-mail ? Regardez dans les indésirables. Vous pouvez aussi{' '}
          <Link href="/connexion">en demander un nouveau</Link>.
        </p>
      </>
    );
  }

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
          aria-describedby={estInvalide(etat, 'email') ? 'erreur-email' : undefined}
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
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={estInvalide(etat, 'motDePasse')}
          aria-describedby="aide-motdepasse"
        />
        <p className="champ__aide" id="aide-motdepasse">
          10 caractères minimum. Une phrase dont vous vous souvenez vaut mieux qu&apos;un mot
          compliqué : la longueur protège plus que les caractères spéciaux.
        </p>
        <ErreurChamp etat={etat} champ="motDePasse" />
      </div>

      <BoutonEnvoi enCours={enCours} libelleEnCours="Création…">
        Créer mon compte
      </BoutonEnvoi>
    </form>
  );
}
