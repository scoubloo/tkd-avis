import { expect, test } from '@playwright/test';
import { adresseUnique, creerCompteConfirme, MOT_DE_PASSE, viderBoite } from './aide';

/**
 * Ce qu'un examinateur essaie en premier. Chaque test correspond à une ligne du
 * dossier de recette.
 */
test.describe('ce qu\'un curieux va essayer', () => {
  test.beforeAll(viderBoite);

  test('un visiteur non connecté ne voit pas exister le back-office', async ({ page }) => {
    for (const chemin of ['/admin', '/admin/utilisateurs', '/admin/cours', '/admin/cours/combat-jeudi']) {
      const reponse = await page.goto(chemin);
      // 404 et non 403 : répondre « interdit » confirmerait que la page existe.
      expect(reponse?.status(), `${chemin} doit répondre 404`).toBe(404);
    }
  });

  test('un membre ordinaire connecté ne voit pas non plus le back-office', async ({ page }) => {
    await creerCompteConfirme(page, adresseUnique('membre'));

    // Le lien n'est pas dans la navigation…
    await expect(page.getByRole('link', { name: 'Administration' })).toHaveCount(0);

    // …et l'URL tapée à la main ne donne rien non plus.
    const reponse = await page.goto('/admin/utilisateurs');
    expect(reponse?.status()).toBe(404);
  });

  test("l'inscription ne révèle pas si une adresse est déjà connue", async ({ page }) => {
    const email = adresseUnique('doublon');
    await creerCompteConfirme(page, email);

    // Déconnexion, puis nouvelle inscription avec la MÊME adresse.
    await page.goto('/');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await page.goto('/inscription');
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe').fill('un-autre-mot-de-passe');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    // Exactement le même message que pour une adresse inconnue.
    await expect(page.getByText('Un e-mail vient de partir')).toBeVisible();
    await expect(page.getByText(/déjà utilisée|existe déjà|compte existant/i)).toHaveCount(0);
  });

  test('la connexion ne distingue pas « compte inconnu » de « mot de passe faux »', async ({ page }) => {
    const email = adresseUnique('inconnu');

    await page.goto('/connexion');
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Adresse e-mail ou mot de passe incorrect')).toBeVisible();
  });

  test('une note hors de 1 à 5 est refusée par le serveur, pas seulement par le navigateur', async ({
    page,
  }) => {
    await creerCompteConfirme(page, adresseUnique('note'));
    await page.goto('/cours/ados-mardi');

    // On force une valeur impossible directement dans le formulaire, comme le
    // ferait quelqu'un avec les outils de développement.
    const refus = await page.evaluate(async () => {
      const champ = document.querySelector('input[name="note"]') as HTMLInputElement | null;
      if (!champ) return 'formulaire absent';
      champ.value = '9';
      champ.checked = true;
      const formulaire = document.querySelector('#formulaire-avis') as HTMLFormElement;
      const zone = formulaire.querySelector('textarea') as HTMLTextAreaElement;
      const poseur = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )!.set!;
      poseur.call(zone, 'Un texte assez long pour passer la validation de longueur minimale.');
      zone.dispatchEvent(new Event('input', { bubbles: true }));
      (formulaire.querySelector('button[type=submit]') as HTMLButtonElement).click();
      return 'envoyé';
    });
    expect(refus).toBe('envoyé');

    // Le serveur refuse, et la note n'apparaît nulle part.
    await expect(page.getByText('La note va de 1 à 5')).toBeVisible();
    await expect(page.getByText('9/5')).toHaveCount(0);
  });

  test('la limitation de débit bloque le bourrinage de mot de passe', async ({ page }) => {
    const email = adresseUnique('bourrinage');

    for (let essai = 1; essai <= 6; essai += 1) {
      await page.goto('/connexion');
      await page.getByLabel('Adresse e-mail').fill(email);
      await page.getByLabel('Mot de passe').fill(`tentative-numero-${essai}`);
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await page.getByRole('alert').waitFor();
    }

    // Au sixième essai, le message change : ce n'est plus « identifiants
    // incorrects » mais un refus de continuer.
    await expect(page.getByText(/Trop de tentatives/)).toBeVisible();
  });

  test('les en-têtes de sécurité sont bien envoyés', async ({ page }) => {
    const reponse = await page.goto('/');
    const entetes = reponse!.headers();
    expect(entetes['x-content-type-options']).toBe('nosniff');
    expect(entetes['x-frame-options']).toBe('DENY');
    expect(entetes['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(entetes['x-robots-tag']).toContain('noindex');
  });
});
