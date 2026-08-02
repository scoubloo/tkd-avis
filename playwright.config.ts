import { defineConfig, devices } from '@playwright/test';

/**
 * Les tests de bout en bout tournent contre une instance LOCALE branchée sur
 * une base `tkd_avis_test` distincte — jamais contre la production : ils créent
 * des comptes, déposent des avis et en suppriment.
 *
 * Le serveur est lancé par `tests/e2e/lancer-serveur.sh`, qui ouvre au besoin
 * un tunnel SSH vers la base de test.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // les tests partagent une base : on les sérialise
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3210/tkd-avis',
    trace: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'] } },
    // Un vrai gabarit de téléphone : c'est là que les débordements
    // horizontaux et les zones tactiles trop petites se voient.
    { name: 'telephone', use: { ...devices['iPhone 13'] } },
  ],
});
