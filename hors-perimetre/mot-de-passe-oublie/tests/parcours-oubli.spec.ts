// Extrait de `tests/e2e/parcours.spec.ts`, retiré le 02/08/2026.
// À recoller dans ce fichier, à l'intérieur du `test.describe`.
//
// Dépendances à rétablir dans `tests/e2e/aide.ts` : `lienDeReinitialisation`
// (donné plus bas) et l'import correspondant en tête de parcours.spec.ts.
//
// ⚠️ Le premier test attendait le lien « Mon compte » dans la navigation pour
// prouver qu'une session était ouverte. Cette page n'existe plus : il attend
// désormais le bouton « Se déconnecter », qui est le nouveau témoin de session.

test('un mot de passe oublié se réinitialise, et ferme les sessions ouvertes', async ({
  page,
  context,
}) => {
  const email = adresseUnique('oubli');
  const NOUVEAU = 'un-tout-autre-mot-de-passe';

  await creerCompteConfirme(page, email);
  // Une session est ouverte à cet instant : on vérifie plus bas qu'elle est
  // bien fermée par la réinitialisation.
  await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();

  await page.goto('mot-de-passe-oublie');
  await page.getByLabel('Votre adresse e-mail').fill(email);
  await page.getByRole('button', { name: 'Recevoir un lien' }).click();
  await expect(page.getByText('Si un compte existe pour cette adresse')).toBeVisible();

  const lien = lienDeReinitialisation(await attendreMail(email));

  // Ouvrir la page ne doit PAS brûler le lien : on l'ouvre deux fois.
  await page.goto(lien);
  await expect(page.getByRole('heading', { name: 'Choisissez un nouveau mot de passe' })).toBeVisible();
  await page.goto(lien);
  await expect(page.getByRole('heading', { name: 'Choisissez un nouveau mot de passe' })).toBeVisible();

  await page.getByLabel('Nouveau mot de passe').fill(NOUVEAU);
  await page.getByRole('button', { name: 'Choisir ce mot de passe' }).click();
  await expect(page.getByText('Votre mot de passe a été changé')).toBeVisible();

  // La session d'avant est morte : la page de connexion s'affiche au lieu de
  // rediriger un utilisateur déjà connecté.
  await page.goto('connexion');
  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible();

  // L'ancien mot de passe ne fonctionne plus…
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Adresse e-mail ou mot de passe incorrect')).toBeVisible();

  // …le nouveau, si. On re-remplit les DEUX champs : après un envoi, React
  // vide les champs non contrôlés du formulaire.
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(NOUVEAU);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();

  // Et le lien de réinitialisation, lui, a bien été consommé.
  await context.clearCookies();
  await page.goto(lien);
  await expect(page.getByRole('heading', { name: "Ce lien n'est plus valable" })).toBeVisible();
});

test("une adresse inconnue reçoit exactement la même réponse", async ({ page }) => {
  await page.goto('mot-de-passe-oublie');
  await page.getByLabel('Votre adresse e-mail').fill(adresseUnique('jamais-inscrit'));
  await page.getByRole('button', { name: 'Recevoir un lien' }).click();
  // Mot pour mot le message d'un compte existant : le formulaire ne dit pas
  // qui est inscrit.
  await expect(page.getByText('Si un compte existe pour cette adresse')).toBeVisible();
});

// --- à recoller dans tests/e2e/aide.ts ------------------------------------

export function lienDeReinitialisation(message: Message): string {
  const trouve = message.texte.match(/https?:\/\/\S+\/reinitialisation\/\S+/);
  if (!trouve) throw new Error(`Pas de lien de réinitialisation dans :\n${message.texte}`);
  return trouve[0];
}
