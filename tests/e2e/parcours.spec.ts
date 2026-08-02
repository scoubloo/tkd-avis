import { expect, test } from '@playwright/test';
import {
  adresseUnique,
  attendreMail,
  connecter,
  creerCompteConfirme,
  lienDeConfirmation,
  MOT_DE_PASSE,
  viderBoite,
  viderCompteurs,
} from './aide';

test.describe('parcours complet', () => {
  test.beforeAll(viderBoite);
  test.beforeEach(viderCompteurs);

  test("de l'inscription au dépôt d'un avis", async ({ page }) => {
    const email = adresseUnique('parcours');

    // --- Inscription ---
    await page.goto('inscription');
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    await expect(page.getByText('Un e-mail vient de partir')).toBeVisible();

    // --- L'e-mail part réellement, avec un lien exploitable ---
    const message = await attendreMail(email);
    expect(message.sujet).toContain('Confirmez votre adresse');
    const lien = lienDeConfirmation(message);

    // --- Tant que l'adresse n'est pas confirmée, pas d'avis possible ---
    await connecterSansAttendre(page, email);
    await expect(page.getByText("Votre adresse n'est pas encore confirmée")).toBeVisible();

    // --- Confirmation ---
    await page.goto(lien);
    await expect(page.getByRole('heading', { name: 'Votre adresse est confirmée' })).toBeVisible();

    // --- Le lien ne fonctionne qu'une fois ---
    await page.goto(lien);
    await expect(page.getByRole('heading', { name: "C'était déjà fait" })).toBeVisible();

    // --- Connexion ---
    await connecter(page, email);

    // --- Dépôt d'un avis ---
    await page.goto('cours/baby-tkd-mercredi');
    await page.locator('input[name=\"note\"][value=\"5\"]').check();
    // `#commentaire` et non getByLabel('Votre avis') : ce libellé désigne AUSSI
    // le titre de la section, et Playwright refuse (à juste titre) un sélecteur
    // qui vise deux éléments.
    await page
      .locator('#commentaire')
      .fill("Ma fille de cinq ans y va depuis la rentrée et elle en parle toute la semaine.");
    await page.getByRole('button', { name: 'Publier mon avis' }).click();
    await expect(page.getByText('Votre avis est enregistré')).toBeVisible();

    // --- Il est visible publiquement, et la moyenne le reflète ---
    await expect(page.locator('.note__valeur').first()).toHaveText('5,0');
    await expect(page.locator('.etiquette', { hasText: 'votre avis' })).toBeVisible();

    // --- Modification : un seul avis, pas un second ---
    await page.locator('input[name=\"note\"][value=\"3\"]').check();
    await page.getByRole('button', { name: 'Modifier mon avis' }).click();
    await expect(page.getByText('Votre avis est enregistré')).toBeVisible();
    await expect(page.getByRole('heading', { name: '1 avis' })).toBeVisible();

    // --- Suppression ---
    await page.getByRole('button', { name: 'Supprimer mon avis' }).click();
    await expect(page.getByText('Votre avis a été supprimé')).toBeVisible();
  });

  test('mes données sont exportables et mon compte supprimable', async ({ page }) => {
    const email = adresseUnique('rgpd');
    await creerCompteConfirme(page, email);

    await page.goto('cours/renforcement-samedi');
    await page.locator('input[name=\"note\"][value=\"4\"]').check();
    await page.locator('#commentaire').fill('Bon complément, bien dosé, on sort détendu.');
    await page.getByRole('button', { name: 'Publier mon avis' }).click();
    await expect(page.getByText('Votre avis est enregistré')).toBeVisible();

    // Droit d'accès et de portabilité : un fichier, en un clic.
    // La requête part DEPUIS la page, pas depuis un contexte de requête séparé :
    // c'est la seule façon d'être certain qu'elle emporte le cookie de session
    // exactement comme le ferait le navigateur d'un visiteur.
    const brut = await page.evaluate(async () => {
      const r = await fetch('/tkd-avis/api/mes-donnees');
      return { statut: r.status, corps: await r.text() };
    });
    expect(brut.statut).toBe(200);
    const donnees = JSON.parse(brut.corps);
    expect(donnees.compte.email).toBe(email);
    expect(donnees.avis).toHaveLength(1);
    expect(JSON.stringify(donnees)).not.toContain(MOT_DE_PASSE);

    // Droit à l'effacement.
    await page.goto('mon-compte');
    await page.getByRole('button', { name: 'Supprimer mon compte' }).click();
    await page.getByLabel('Écrivez SUPPRIMER pour confirmer').fill('SUPPRIMER');
    await page.getByRole('button', { name: 'Supprimer définitivement' }).click();
    await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();

    // Le compte n'existe plus : impossible de s'y reconnecter.
    await connecterSansAttendre(page, email);
    await expect(page.getByText('Adresse e-mail ou mot de passe incorrect')).toBeVisible();
  });
});

/** Connexion sans attendre la réussite — pour tester les refus. */
async function connecterSansAttendre(page: import('@playwright/test').Page, email: string) {
  await page.goto('connexion');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}
