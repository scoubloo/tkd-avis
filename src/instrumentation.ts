/**
 * Exécuté une fois, au démarrage du serveur, avant la première requête.
 *
 * C'est ici que la configuration est validée : une variable manquante fait
 * échouer le démarrage avec un message explicite, plutôt que de produire une
 * erreur 500 au moment où quelqu'un attend son e-mail de confirmation.
 *
 * Un conteneur qui refuse de démarrer se voit tout de suite. Un conteneur qui
 * démarre et échoue au premier visiteur peut passer des heures inaperçu.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { env } = await import('@/lib/env');
  const configuration = env();

  console.info(
    `[démarrage] configuration validée — adresse publique ${configuration.PUBLIC_URL}, ` +
      `envoi via ${configuration.SMTP_HOST}:${configuration.SMTP_PORT}`,
  );
}
