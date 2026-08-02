'use client';

import { useEffect } from 'react';

/**
 * Écran d'erreur.
 *
 * Il ne montre JAMAIS le message technique : une trace d'exception révèle des
 * noms de tables, des chemins de fichiers, parfois une chaîne de connexion. Le
 * détail part dans les journaux du serveur, où il sert à quelque chose.
 *
 * ⚠️ Le bouton recharge la page ENTIÈREMENT, il n'appelle pas `reset()`.
 *
 * Défaut réel, reproduit le 02/08/2026 : quand l'application est redéployée,
 * une page restée ouverte dans un navigateur continue de désigner une version
 * qui n'existe plus côté serveur. Le formulaire échoue, cet écran s'affiche —
 * et `reset()` ne fait que ré-afficher la même page périmée. L'utilisateur
 * réessaie indéfiniment sans jamais y arriver : de son point de vue, « le
 * bouton n'a plus aucun effet ». Seul un rechargement complet récupère la
 * nouvelle version.
 */
export default function Erreur({ error }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[écran erreur]', error.message);
  }, [error]);

  return (
    <div className="etroit">
      <h1>Quelque chose s&apos;est mal passé</h1>
      <div className="message message--erreur" role="alert">
        <p>
          L&apos;action n&apos;a pas pu aboutir. <strong>Rien n&apos;a été perdu.</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          Si cette page était ouverte depuis un moment, l&apos;application a peut-être été mise à
          jour entre-temps : rechargez-la, puis recommencez.
        </p>
      </div>
      <button
        type="button"
        className="bouton"
        onClick={() => {
          window.location.reload();
        }}
      >
        Recharger la page
      </button>
    </div>
  );
}
