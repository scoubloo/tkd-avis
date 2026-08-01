'use client';

import { useActionState, useState } from 'react';
import { BoutonEnvoi, ErreurChamp, Message, estInvalide } from '@/components/Formulaire';
import { deposerAvis, supprimerAvis } from '@/lib/actions/avis';
import { ETAT_INITIAL } from '@/lib/formulaire';

const LIBELLES: Record<number, string> = {
  1: 'À éviter',
  2: 'Décevant',
  3: 'Correct',
  4: 'Très bien',
  5: 'Excellent',
};

export function FormulaireAvis({
  coursId,
  avisExistant,
}: {
  coursId: string;
  avisExistant: { note: number; commentaire: string } | null;
}) {
  const [etat, action, enCours] = useActionState(deposerAvis, ETAT_INITIAL);
  const [note, setNote] = useState(avisExistant?.note ?? 0);
  const [longueur, setLongueur] = useState(avisExistant?.commentaire.length ?? 0);

  return (
    <>
      <form action={action} noValidate id="formulaire-avis">
      <input type="hidden" name="coursId" value={coursId} />
      <Message etat={etat} />

      <fieldset style={{ border: 0, padding: 0, margin: '0 0 1.1rem' }}>
        <legend className="champ__intitule" style={{ padding: 0 }}>
          Votre note
        </legend>

        {/* Cinq vrais boutons radio : navigables au clavier avec les flèches,
            annoncés correctement, et fonctionnels même sans JavaScript. */}
        <div className="rangee" style={{ gap: '.4rem' }}>
          {[1, 2, 3, 4, 5].map((valeur) => (
            <label
              key={valeur}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.35rem',
                padding: '.45rem .7rem',
                border: `1px solid ${note === valeur ? 'var(--primaire)' : '#c9c6bd'}`,
                background: note === valeur ? 'var(--primaire-fond)' : 'var(--surface)',
                borderRadius: 'var(--rayon-petit)',
                cursor: 'pointer',
                fontWeight: note === valeur ? 650 : 400,
                minHeight: 44,
              }}
            >
              <input
                type="radio"
                name="note"
                value={valeur}
                checked={note === valeur}
                onChange={() => setNote(valeur)}
                required
                style={{ margin: 0 }}
              />
              <span aria-hidden="true">{valeur}</span>
              <span className="sr-only">
                {valeur} sur 5 — {LIBELLES[valeur]}
              </span>
            </label>
          ))}
        </div>

        {note > 0 && (
          <p className="champ__aide" aria-live="polite">
            {LIBELLES[note]}
          </p>
        )}
        <ErreurChamp etat={etat} champ="note" />
      </fieldset>

      <div className="champ">
        <label className="champ__intitule" htmlFor="commentaire">
          Votre avis
        </label>
        <textarea
          id="commentaire"
          name="commentaire"
          required
          minLength={10}
          maxLength={2000}
          defaultValue={avisExistant?.commentaire ?? ''}
          onChange={(e) => setLongueur(e.target.value.length)}
          aria-invalid={estInvalide(etat, 'commentaire')}
          aria-describedby="aide-commentaire"
          placeholder="Ce que vous avez pensé du cours : le rythme, les explications, l'ambiance…"
        />
        <p className="champ__aide" id="aide-commentaire">
          <span aria-live="polite">{longueur}</span> / 2000 caractères — 10 minimum.
        </p>
        <ErreurChamp etat={etat} champ="commentaire" />
      </div>

        <BoutonEnvoi enCours={enCours} libelleEnCours="Enregistrement…">
          {avisExistant ? 'Modifier mon avis' : 'Publier mon avis'}
        </BoutonEnvoi>
      </form>

      {avisExistant && <FormulaireSuppression coursId={coursId} />}
    </>
  );
}

/**
 * Formulaire SÉPARÉ, frère du précédent — un `<form>` ne peut pas en contenir
 * un autre : le navigateur supprime le formulaire imbriqué au moment de
 * l'analyse du HTML, et le bouton devient inerte sans le moindre message.
 *
 * Deux formulaires distincts évitent aussi qu'un « supprimer » et un
 * « enregistrer » partagent le même envoi.
 */
function FormulaireSuppression({ coursId }: { coursId: string }) {
  const [etat, action, enCours] = useActionState(supprimerAvis, ETAT_INITIAL);

  return (
    <form action={action} style={{ marginTop: '1rem' }}>
      <input type="hidden" name="coursId" value={coursId} />
      <Message etat={etat} />
      <button type="submit" className="bouton bouton--danger" disabled={enCours}>
        {enCours ? 'Suppression…' : 'Supprimer mon avis'}
      </button>
    </form>
  );
}
