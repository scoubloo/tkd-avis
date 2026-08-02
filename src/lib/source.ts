import 'server-only';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

/**
 * Lecture du code source embarqué dans l'image, pour la page « coulisses ».
 *
 * Le code affiché est **celui qui tourne** : il est copié depuis l'étape de
 * construction, pas déposé à côté. On ne peut donc pas montrer une chose et en
 * exécuter une autre.
 *
 * ⚠️ Embarquer ses sources dans une image de production n'est pas un réflexe
 * anodin — c'est de la surface d'attaque en plus. C'est assumé ici pour une
 * raison précise : cette application est un exercice destiné à être VÉRIFIÉ. Le
 * code ne contient aucun secret (ils vivent tous dans des variables
 * d'environnement), et l'accès est en lecture seule, sur une liste blanche
 * d'extensions.
 */
const RACINE = resolve(process.env.SOURCE_DIR ?? join(process.cwd(), 'source'));

const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.sql', '.mjs', '.json', '.yml', '.md', '.sh']);
const NOMS_ENTIERS = new Set(['Dockerfile', '.dockerignore', '.gitignore', '.env.example']);
const IGNORES = new Set(['node_modules', '.next', '.git', 'test-results', 'donnees', 'package-lock.json']);

export type Fichier = { chemin: string; taille: number; lignes: number };

/** Liste récursive des fichiers affichables, triée. */
export async function listerFichiers(): Promise<Fichier[]> {
  const sortie: Fichier[] = [];

  async function parcourir(dossier: string) {
    let entrees;
    try {
      entrees = await readdir(dossier, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entrees) {
      if (IGNORES.has(e.name)) continue;
      const complet = join(dossier, e.name);
      if (e.isDirectory()) {
        await parcourir(complet);
      } else if (affichable(e.name)) {
        const infos = await stat(complet);
        const contenu = await readFile(complet, 'utf8');
        sortie.push({
          chemin: relative(RACINE, complet),
          taille: infos.size,
          lignes: contenu.split('\n').length,
        });
      }
    }
  }

  await parcourir(RACINE);
  return sortie.sort((a, b) => a.chemin.localeCompare(b.chemin, 'fr'));
}

function affichable(nom: string): boolean {
  if (NOMS_ENTIERS.has(nom)) return true;
  const point = nom.lastIndexOf('.');
  return point > 0 && EXTENSIONS.has(nom.slice(point));
}

/**
 * Rend le contenu d'un fichier, ou `null`.
 *
 * ⚠️ Le chemin demandé est RÉSOLU puis vérifié comme étant sous la racine.
 * Sans ce contrôle, « ../../etc/passwd » sortirait du répertoire prévu : c'est
 * la traversée de répertoire, la faille la plus banale d'un navigateur de
 * fichiers. Une liste blanche d'extensions ne suffit PAS à s'en protéger.
 */
export async function lireFichier(chemin: string): Promise<string | null> {
  const complet = resolve(RACINE, chemin);
  if (complet !== RACINE && !complet.startsWith(RACINE + sep)) return null;

  const nom = complet.split(sep).pop() ?? '';
  if (!affichable(nom)) return null;

  try {
    const infos = await stat(complet);
    if (!infos.isFile() || infos.size > 400_000) return null;
    return await readFile(complet, 'utf8');
  } catch {
    return null;
  }
}

/** Regroupe l'arborescence par dossier de premier niveau, pour l'affichage. */
export function parDossier(fichiers: Fichier[]): Map<string, Fichier[]> {
  const groupes = new Map<string, Fichier[]>();
  for (const f of fichiers) {
    const morceaux = f.chemin.split('/');
    const groupe = morceaux.length === 1 ? 'à la racine' : morceaux.slice(0, 2).join('/');
    const liste = groupes.get(groupe) ?? [];
    liste.push(f);
    groupes.set(groupe, liste);
  }
  return groupes;
}
