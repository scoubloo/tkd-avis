'use client';

import { useEffect, useState } from 'react';

/**
 * Écran d'erreur — et surtout, rattrapage automatique.
 *
 * Il ne montre JAMAIS le message technique : une trace d'exception révèle des
 * noms de tables, des chemins de fichiers, parfois une chaîne de connexion. Le
 * détail part dans les journaux du serveur, où il sert à quelque chose.
 *
 * ⚠️ CAS RÉEL, observé le 02/08/2026 sur un vrai utilisateur.
 *
 * Quand l'application est redéployée, une page restée ouverte dans un
 * navigateur continue de désigner une version qui n'existe plus côté serveur.
 * Le premier geste de l'utilisateur — envoyer un avis, se connecter — échoue,
 * et cet écran s'affichait avec un bouton « Réessayer » qui ne pouvait JAMAIS
 * aboutir : il ré-affichait la même page périmée. Une personne est restée
 * bloquée là, en pensant que l'application était cassée.
 *
 * La page se recharge donc TOUTE SEULE, une fois. Le rechargement récupère la
 * version courante et l'utilisateur n'a rien à comprendre.
 *
 * Le garde-fou compte : sans lui, une erreur qui se reproduit après le
 * rechargement ferait boucler le navigateur à l'infini. Au deuxième échec en
 * moins de trente secondes, on s'arrête et on affiche l'écran.
 */
const CLE = 'tkd-avis:dernier-rechargement';
const FENETRE_MS = 30_000;

export default function Erreur({ error }: { error: Error; reset: () => void }) {
  const [rattrapageEpuise, setRattrapageEpuise] = useState(false);

  useEffect(() => {
    console.error('[écran erreur]', error.message);

    let dernier = 0;
    try {
      dernier = Number(window.sessionStorage.getItem(CLE) ?? 0);
    } catch {
      /* stockage indisponible : on affichera simplement le bouton */
    }

    if (Date.now() - dernier > FENETRE_MS) {
      try {
        window.sessionStorage.setItem(CLE, String(Date.now()));
      } catch {
        /* rien à faire */
      }
      window.location.reload();
      return;
    }

    // Deuxième échec rapproché : le rechargement n'a rien réglé, on arrête.
    setRattrapageEpuise(true);
  }, [error]);

  if (!rattrapageEpuise) {
    return (
      <div className="etroit">
        <h1>Un instant…</h1>
        <div className="message message--info" role="status">
          <p style={{ marginBottom: 0 }}>
            L&apos;application a été mise à jour pendant que vous l&apos;utilisiez. La page se
            recharge toute seule, puis vous pourrez recommencer. <strong>Rien n&apos;est perdu.</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="etroit">
      <h1>Quelque chose s&apos;est mal passé</h1>
      <div className="message message--erreur" role="alert">
        <p>
          L&apos;action n&apos;a pas pu aboutir. <strong>Rien n&apos;a été perdu.</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          Le rechargement automatique n&apos;a pas suffi. Réessayez dans un instant ; si le problème
          persiste, c&apos;est de notre côté.
        </p>
      </div>
      <button type="button" className="bouton" onClick={() => window.location.reload()}>
        Recharger la page
      </button>
    </div>
  );
}
