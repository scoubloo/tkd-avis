import { expect, test } from '@playwright/test';
import { sansDebordementHorizontal } from './aide';

const PAGES_PUBLIQUES = [
  '/',
  '/cours/poomsae-vendredi',
  '/inscription',
  '/connexion',
  '/mentions-legales',
  '/confidentialite',
];

test.describe('affichage', () => {
  for (const largeur of [320, 375, 768, 1280]) {
    test(`aucune page ne déborde horizontalement à ${largeur} px`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 800 });
      for (const chemin of PAGES_PUBLIQUES) {
        await page.goto(chemin);
        expect(
          await sansDebordementHorizontal(page),
          `${chemin} déborde à ${largeur} px`,
        ).toBe(true);
      }
    });
  }

  test('les champs de saisie font au moins 16 px (sinon iOS zoome tout seul)', async ({ page }) => {
    await page.goto('/inscription');
    for (const selecteur of ['#email', '#motDePasse']) {
      const taille = await page.locator(selecteur).evaluate((e) =>
        parseFloat(getComputedStyle(e).fontSize),
      );
      expect(taille, `${selecteur} est trop petit`).toBeGreaterThanOrEqual(16);
    }
  });

  test('le formulaire est utilisable entièrement au clavier', async ({ page }) => {
    await page.goto('/connexion');

    await page.getByLabel('Adresse e-mail').focus();
    await page.keyboard.type('clavier@exemple.fr');
    await page.keyboard.press('Tab');
    await page.keyboard.type('un-mot-de-passe');
    await page.keyboard.press('Tab');

    // Le bouton d'envoi doit être l'élément suivant dans l'ordre de tabulation.
    const actif = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(actif).toBe('Se connecter');
  });

  test('chaque page a un titre unique et une langue déclarée', async ({ page }) => {
    const titres = new Set<string>();
    for (const chemin of PAGES_PUBLIQUES) {
      await page.goto(chemin);
      expect(await page.locator('html').getAttribute('lang')).toBe('fr');
      const titre = await page.title();
      expect(titre.length, `${chemin} n'a pas de titre`).toBeGreaterThan(5);
      titres.add(titre);
    }
    expect(titres.size, 'des pages partagent le même titre').toBe(PAGES_PUBLIQUES.length);
  });

  test('une page inexistante répond 404 avec un écran lisible', async ({ page }) => {
    const reponse = await page.goto('/cette-page-nexiste-pas');
    expect(reponse?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });
});
