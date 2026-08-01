'use client';

import { useEffect } from 'react';

/**
 * Écran d'erreur.
 *
 * Il ne montre JAMAIS le message technique : une trace d'exception révèle des
 * noms de tables, des chemins de fichiers, parfois une chaîne de connexion. Le
 * détail part dans les journaux du serveur, où il sert à quelque chose.
 */
export default function Erreur({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[écran erreur]', error.message);
  }, [error]);

  return (
    <div className="etroit">
      <h1>Quelque chose s&apos;est mal passé</h1>
      <div className="message message--erreur" role="alert">
        <p>
          L&apos;action n&apos;a pas pu aboutir. Rien n&apos;a été perdu : vous pouvez réessayer.
        </p>
      </div>
      <button type="button" className="bouton" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
