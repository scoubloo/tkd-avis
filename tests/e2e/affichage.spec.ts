import { expect, test } from '@playwright/test';
import {
  adresseUnique,
  creerCompteConfirme,
  sansDebordementHorizontal,
  viderBoite,
  viderCompteurs,
} from './aide';

const PAGES_PUBLIQUES = [
  '',
  'cours/poomsae-vendredi',
  'inscription',
  'connexion',
  'mentions-legales',
  'confidentialite',
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
    await page.goto('inscription');
    for (const selecteur of ['#email', '#motDePasse']) {
      const taille = await page.locator(selecteur).evaluate((e) =>
        parseFloat(getComputedStyle(e).fontSize),
      );
      expect(taille, `${selecteur} est trop petit`).toBeGreaterThanOrEqual(16);
    }
  });

  test('le formulaire se remplit et se valide au clavier seul', async ({ page }) => {
    await page.goto('connexion');

    // ⚠️ On ne teste PAS l'ordre exact de tabulation : Safari, par défaut, ne
    // met pas les boutons dans le parcours de tabulation. Ce qui doit être vrai
    // partout, c'est qu'on peut remplir le formulaire et le valider sans souris.
    await page.getByLabel('Adresse e-mail').focus();
    await page.keyboard.type('clavier@exemple.fr');
    await page.keyboard.press('Tab');
    await page.keyboard.type('un-mot-de-passe');
    await page.keyboard.press('Enter'); // validation implicite

    await expect(page.getByRole('alert')).toBeVisible();
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

  test('les boutons de note sont annoncés en toutes lettres', async ({ page }) => {
    // Le formulaire n'existe que pour un membre confirmé : le test crée donc un
    // compte. Une version précédente se contentait de s'IGNORER quand le
    // formulaire était absent — c'est-à-dire toujours, puisqu'elle visitait la
    // page sans être connectée. Un test qui s'ignore ne prouve rien.
    await viderBoite();
    await viderCompteurs();
    await creerCompteConfirme(page, adresseUnique('a11y'));
    await page.goto('cours/poomsae-vendredi');

    // Le chiffre visible porte aria-hidden : ce qui est annoncé, c'est le texte
    // réservé aux lecteurs d'écran. Sans lui, une personne non voyante entend
    // « 1, 2, 3, 4, 5 » sans savoir de quoi il s'agit.
    await expect(page.locator('input[name="note"]')).toHaveCount(5);
    for (const valeur of [1, 3, 5]) {
      await expect(
        page.locator(`input[name="note"][value="${valeur}"] ~ .sr-only`),
      ).toHaveText(new RegExp(`^${valeur} sur 5`));
    }
  });

  test('une page inexistante répond 404 avec un écran lisible', async ({ page }) => {
    const reponse = await page.goto('cette-page-nexiste-pas');
    expect(reponse?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });
});
