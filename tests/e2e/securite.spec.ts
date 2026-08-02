import { expect, test } from '@playwright/test';
import {
  adresseUnique,
  creerCompteConfirme,
  MOT_DE_PASSE,
  viderBoite,
  viderCompteurs,
} from './aide';

/**
 * Ce qu'un examinateur essaie en premier. Chaque test correspond à une ligne du
 * dossier de recette.
 */
test.describe('ce qu\'un curieux va essayer', () => {
  test.beforeAll(viderBoite);
  test.beforeEach(viderCompteurs);

  test('un visiteur non connecté ne voit pas exister le back-office', async ({ page }) => {
    for (const chemin of ['admin', 'admin/utilisateurs', 'admin/cours', 'admin/cours/combat-jeudi']) {
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
    const reponse = await page.goto('admin/utilisateurs');
    expect(reponse?.status()).toBe(404);
  });

  test("un membre ne voit ni les avis des autres, ni la moindre moyenne", async ({ page }) => {
    // ⚠️ Ce test garde la SEULE règle métier que le cahier des charges énonce :
    // les moyennes, les comptages et la lecture des avis d'autrui sont rangés
    // sous « fonctionnalité admin ». Les avoir mis côté public a été le reproche
    // du 02/08/2026 ; sans ce test, rien n'empêche de les y remettre un jour
    // « pour faire plus vivant ».
    const TEXTE = 'Phrase temoin deposee par le premier membre pour ce test de frontiere.';

    const premier = adresseUnique('frontiere-a');
    await creerCompteConfirme(page, premier);
    await page.goto('cours/combat-jeudi');
    await page.locator('input[name="note"][value="5"]').check();
    await page.locator('#commentaire').fill(TEXTE);
    await page.getByRole('button', { name: 'Publier mon avis' }).click();
    await expect(page.getByText('Votre avis est enregistré')).toBeVisible();

    // Déconnexion, puis un SECOND membre ouvre le même cours.
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await page.getByRole('link', { name: 'Créer un compte' }).waitFor();
    await viderCompteurs();
    await creerCompteConfirme(page, adresseUnique('frontiere-b'));
    await page.goto('cours/combat-jeudi');

    // Il ne lit pas l'avis du premier…
    await expect(page.getByText(TEXTE)).toHaveCount(0);
    // …et aucune note agrégée ne s'affiche : les étoiles n'existent plus que
    // dans le back-office.
    await expect(page.locator('.etoiles')).toHaveCount(0);
    await expect(page.locator('.note__valeur')).toHaveCount(0);

    // Son propre formulaire, lui, est bien là : c'est ce que l'énoncé demande.
    await expect(page.getByRole('button', { name: 'Publier mon avis' })).toBeVisible();
  });

  test("l'inscription ne révèle pas si une adresse est déjà connue", async ({ page }) => {
    const email = adresseUnique('doublon');
    await creerCompteConfirme(page, email);

    // Déconnexion, puis nouvelle inscription avec la MÊME adresse.
    await page.goto('');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    // ⚠️ Attendre que la déconnexion ait ABOUTI. Sans cette attente, la
    // navigation suivante partait encore connectée — et `/inscription` renvoie
    // alors vers l'accueil, où il n'y a aucun champ à remplir. Le test expirait
    // en accusant l'application.
    await page.getByRole('link', { name: 'Créer un compte' }).waitFor();
    await page.goto('inscription');
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe').fill('un-autre-mot-de-passe');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    // Exactement le même message que pour une adresse inconnue.
    await expect(page.getByText('Un e-mail vient de partir')).toBeVisible();
    await expect(page.getByText(/déjà utilisée|existe déjà|compte existant/i)).toHaveCount(0);
  });

  test('la connexion ne distingue pas « compte inconnu » de « mot de passe faux »', async ({ page }) => {
    const email = adresseUnique('inconnu');

    await page.goto('connexion');
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Adresse e-mail ou mot de passe incorrect')).toBeVisible();
  });

  test('une note hors de 1 à 5 est refusée par le serveur, pas seulement par le navigateur', async ({
    page,
  }) => {
    await creerCompteConfirme(page, adresseUnique('note'));
    await page.goto('cours/ados-mardi');

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

    // ⚠️ On attend la RÉPONSE du serveur à chaque essai, pas l'apparition d'un
    // message à l'écran, et on ne recharge pas la page entre deux essais.
    //
    // La version précédente rechargeait `/connexion` à chaque tour et attendait
    // le bloc d'alerte. Deux fragilités, qui se sont réveillées le 02/08/2026
    // sur le profil iPhone : l'alerte de l'essai précédent est encore là quand
    // on l'attend (donc le tour suivant part trop tôt), et si le formulaire
    // part en envoi natif — ce qui arrive tant que la page n'est pas hydratée —
    // le rechargement suivant entre en collision avec la navigation en cours.
    // Playwright s'arrêtait alors sur « navigation interrompue » sans rien
    // prouver ni infirmer sur la limitation elle-même.
    await page.goto('connexion');

    for (let essai = 1; essai <= 6; essai += 1) {
      await page.getByLabel('Adresse e-mail').fill(email);
      await page.getByLabel('Mot de passe').fill(`tentative-numero-${essai}`);
      await Promise.all([
        page.waitForResponse(
          (r) => r.request().method() === 'POST' && r.url().includes('/connexion'),
        ),
        page.getByRole('button', { name: 'Se connecter' }).click(),
      ]);
    }

    // Au sixième essai, le message change : ce n'est plus « identifiants
    // incorrects » mais un refus de continuer.
    await expect(page.getByText(/Trop de tentatives/)).toBeVisible();
  });

  test('les en-têtes de sécurité sont bien envoyés', async ({ page }) => {
    const reponse = await page.goto('');
    const entetes = reponse!.headers();
    expect(entetes['x-content-type-options']).toBe('nosniff');
    expect(entetes['x-frame-options']).toBe('DENY');
    expect(entetes['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(entetes['x-robots-tag']).toContain('noindex');
  });
});
