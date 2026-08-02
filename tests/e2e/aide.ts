import { readFile, writeFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';

const FICHIER_MAILS = process.env.CAPTURE_MAIL_FICHIER ?? '/tmp/tkd-avis-mails.jsonl';

/** Adresse unique par test : les tests ne doivent pas se marcher dessus. */
export function adresseUnique(prefixe: string): string {
  return `${prefixe}-${Date.now()}-${Math.floor(Math.random() * 10000)}@exemple.fr`;
}

export const MOT_DE_PASSE = 'une-phrase-de-passe-solide';

export async function viderBoite(): Promise<void> {
  await writeFile(FICHIER_MAILS, '');
}

type Message = { destinataire: string; sujet: string; texte: string };

/** Attend l'e-mail destiné à une adresse et le rend. */
export async function attendreMail(destinataire: string, delaiMs = 15_000): Promise<Message> {
  const fin = Date.now() + delaiMs;
  while (Date.now() < fin) {
    let contenu = '';
    try {
      contenu = await readFile(FICHIER_MAILS, 'utf8');
    } catch {
      /* le fichier n'existe pas encore */
    }
    const messages = contenu
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Message)
      .filter((m) => m.destinataire === destinataire);
    if (messages.length > 0) return messages[messages.length - 1]!;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Aucun e-mail reçu pour ${destinataire} en ${delaiMs} ms.`);
}

export function lienDeConfirmation(message: Message): string {
  const trouve = message.texte.match(/https?:\/\/\S+\/confirmation\/\S+/);
  if (!trouve) throw new Error(`Pas de lien de confirmation dans :\n${message.texte}`);
  return trouve[0];
}

/** Inscription complète : création, confirmation par le lien reçu, connexion. */
export async function creerCompteConfirme(page: Page, email: string): Promise<void> {
  await page.goto('/inscription');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.getByText('Un e-mail vient de partir').waitFor();

  const lien = lienDeConfirmation(await attendreMail(email));
  await page.goto(lien);
  await page.getByRole('heading', { name: 'Votre adresse est confirmée' }).waitFor();

  await connecter(page, email);
}

export async function connecter(page: Page, email: string): Promise<void> {
  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('link', { name: 'Mon compte' }).waitFor();
}

/**
 * Vérifie qu'aucun élément ne déborde horizontalement.
 *
 * Le test compare la largeur du document à celle de la fenêtre : c'est ce qui
 * attrape les débordements dus à `min-width: auto` sur les enfants de grille,
 * et les tableaux qui poussent la page au lieu de défiler dans leur cadre.
 */
export async function sansDebordementHorizontal(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollWidth <= d.clientWidth + 1;
  });
}
