import { hash, verify } from '@node-rs/argon2';

/**
 * Paramètres recommandés par l'OWASP (Password Storage Cheat Sheet, éd. 2025) :
 * 19 Mio de mémoire, 2 itérations, 1 fil.
 *
 * Le coût mémoire est ce qui rend une attaque par carte graphique coûteuse.
 * Le baisser pour « aller plus vite » est exactement ce qu'il ne faut pas faire.
 *
 * L'algorithme n'est pas passé explicitement : argon2id est la valeur par
 * défaut de la bibliothèque (vérifié dans `index.d.ts`, pas supposé). Plutôt
 * que de le déclarer dans un commentaire, le test `password.test.ts` vérifie
 * que l'empreinte produite commence bien par `$argon2id$` — si une mise à jour
 * changeait ce défaut, le test tomberait.
 */
const PARAMETRES = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  return hash(motDePasse, PARAMETRES);
}

/**
 * Vérifie un mot de passe contre son empreinte.
 *
 * Ne lève jamais : une empreinte corrompue en base doit se traduire par un
 * refus de connexion, pas par une erreur 500 qui révèle que le compte existe.
 */
export async function verifierMotDePasse(empreinte: string, motDePasse: string): Promise<boolean> {
  try {
    return await verify(empreinte, motDePasse, PARAMETRES);
  } catch {
    return false;
  }
}

/**
 * Égalise le temps de réponse quand l'adresse saisie n'existe pas.
 *
 * Sans cela, une connexion sur un compte inexistant répond en une milliseconde
 * et une connexion sur un compte réel en cinquante : l'écart suffit à énumérer
 * les comptes au chronomètre, sans jamais deviner un seul mot de passe.
 *
 * ⚠️ L'empreinte de référence est CALCULÉE une fois, elle n'est pas écrite en
 * dur : une empreinte inventée serait rejetée par `verify` avant même le calcul,
 * et ne brûlerait donc aucun temps — la protection serait décorative.
 */
let empreinteFactice: Promise<string> | null = null;

export async function brulerDuTemps(): Promise<void> {
  empreinteFactice ??= hash('compte-inexistant', PARAMETRES);
  try {
    await verify(await empreinteFactice, 'mot-de-passe-qui-ne-correspondra-jamais', PARAMETRES);
  } catch {
    /* le résultat n'a aucune importance : seul le temps passé compte */
  }
}
