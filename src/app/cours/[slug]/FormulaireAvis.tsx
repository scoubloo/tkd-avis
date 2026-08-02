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
  // ⚠️ L'état de la SUPPRESSION vit ici, dans le composant parent, et pas dans
  // le formulaire de suppression lui-même.
  //
  // Défaut trouvé par les tests : ce formulaire n'existe que si un avis existe.
  // Une fois l'avis supprimé, il était démonté — emportant avec lui le message
  // « Votre avis a été supprimé ». L'utilisateur cliquait, tout disparaissait,
  // et rien ne lui confirmait que son geste avait abouti.
  const [etatSuppression, actionSuppression, suppressionEnCours] = useActionState(
    supprimerAvis,
    ETAT_INITIAL,
  );
  const [note, setNote] = useState(avisExistant?.note ?? 0);
  const [longueur, setLongueur] = useState(avisExistant?.commentaire.length ?? 0);

  return (
    <>
      <Message etat={etatSuppression} />

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

      {avisExistant && (
        <form action={actionSuppression} style={{ marginTop: '1rem' }}>
          <input type="hidden" name="coursId" value={coursId} />
          <button type="submit" className="bouton bouton--danger" disabled={suppressionEnCours}>
            {suppressionEnCours ? 'Suppression…' : 'Supprimer mon avis'}
          </button>
        </form>
      )}
    </>
  );
}
