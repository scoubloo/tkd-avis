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

  test('tout le texte affiché atteint le contraste minimal exigé (WCAG AA)', async ({ page }) => {
    // Défaut réel du 02/08/2026 : le bouton « Créer un compte » de l'en-tête
    // héritait de la couleur des liens de navigation — gris foncé sur bleu
    // marine, 1,6:1. Invisible dans une relecture de code, évident à l'œil.
    for (const chemin of ['', 'inscription', 'connexion', 'cours/poomsae-vendredi']) {
      await page.goto(chemin);

      const fautifs = await page.evaluate(() => {
        const luminance = (couleur: string): number => {
          const [r, v, b] = (couleur.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).map(Number) as [
            number,
            number,
            number,
          ];
          const canal = (c: number) => {
            const x = c / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
        };

        const fondEffectif = (el: Element): string => {
          let noeud: Element | null = el;
          while (noeud) {
            const fond = getComputedStyle(noeud).backgroundColor;
            if (fond && !fond.startsWith('rgba(0, 0, 0, 0)')) return fond;
            noeud = noeud.parentElement;
          }
          return 'rgb(255, 255, 255)';
        };

        const problemes: { texte: string; rapport: number }[] = [];
        for (const el of document.querySelectorAll('a, button, p, h1, h2, h3, td, th, label, span')) {
          const texte = (el.textContent ?? '').trim();
          if (!texte || el.children.length > 0) continue;
          const style = getComputedStyle(el);
          if (style.visibility === 'hidden' || style.display === 'none') continue;
          const taille = parseFloat(style.fontSize);
          const gras = parseInt(style.fontWeight, 10) >= 700;
          const seuil = taille >= 24 || (taille >= 18.66 && gras) ? 3 : 4.5;

          const l1 = luminance(style.color);
          const l2 = luminance(fondEffectif(el));
          const rapport = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          if (rapport < seuil) problemes.push({ texte: texte.slice(0, 40), rapport: Math.round(rapport * 100) / 100 });
        }
        return problemes;
      });

      expect(fautifs, `contraste insuffisant sur « ${chemin || 'accueil'} »`).toEqual([]);
    }
  });

  test('une page inexistante répond 404 avec un écran lisible', async ({ page }) => {
    const reponse = await page.goto('cette-page-nexiste-pas');
    expect(reponse?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });
});
