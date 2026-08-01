import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Jetons transmis par URL (confirmation d'adresse, réinitialisation de mot de
 * passe) et jetons de session.
 *
 * Trois règles, toutes appliquées ici :
 *  1. le jeton est tiré de `randomBytes` — jamais de `Math.random`, qui est
 *     prédictible et n'a rien à faire dans un contexte de sécurité ;
 *  2. seule son EMPREINTE est stockée, jamais le jeton lui-même ;
 *  3. les comparaisons se font à temps constant.
 */

/** 32 octets = 256 bits d'entropie. Encodé en base64url : sûr dans une URL. */
export function creerJeton(): string {
  return randomBytes(32).toString('base64url');
}

export function empreinte(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex');
}

/**
 * Comparaison à temps constant.
 *
 * Une comparaison `===` classique s'arrête au premier caractère différent : le
 * temps de réponse renseigne alors sur le nombre de caractères déjà devinés.
 */
export function comparerEmpreintes(a: string, b: string): boolean {
  const ta = Buffer.from(a, 'utf8');
  const tb = Buffer.from(b, 'utf8');
  if (ta.length !== tb.length) return false;
  return timingSafeEqual(ta, tb);
}

/** Durée de validité d'un lien reçu par e-mail. */
export const DUREE_JETON_EMAIL_MS = 24 * 60 * 60 * 1000;

/** Durée de vie d'une session. */
export const DUREE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export function dansMs(ms: number): Date {
  return new Date(Date.now() + ms);
}
