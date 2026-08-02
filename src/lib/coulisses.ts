import 'server-only';
import { sql } from '@/db';

/**
 * Lectures pour la section « coulisses ».
 *
 * Principe non négociable : **rien n'est recopié à la main.** Le schéma affiché
 * est lu dans les catalogues de PostgreSQL au moment où la page est demandée.
 * Si quelqu'un modifiait une contrainte en base, la page le montrerait à la
 * seconde suivante — c'est ce qui distingue une preuve d'une capture d'écran.
 */

export type Colonne = {
  table: string;
  nom: string;
  type: string;
  obligatoire: boolean;
  defaut: string | null;
};

export async function colonnes(): Promise<Colonne[]> {
  return sql<Colonne[]>`
    SELECT c.table_name  AS table,
           c.column_name AS nom,
           CASE
             WHEN c.data_type = 'character varying' THEN 'texte(' || c.character_maximum_length || ')'
             WHEN c.data_type = 'timestamp with time zone' THEN 'date+heure'
             WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
             ELSE c.data_type
           END AS type,
           (c.is_nullable = 'NO') AS obligatoire,
           c.column_default AS defaut
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
     WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
     ORDER BY c.table_name, c.ordinal_position
  `;
}

export type Contrainte = { table: string; nom: string; genre: string; definition: string };

/**
 * Les contraintes, telles que PostgreSQL les a réellement enregistrées.
 *
 * `pg_get_constraintdef` rend le texte que la base applique — pas celui du
 * fichier de migration. C'est la différence entre « voici ce que j'ai écrit » et
 * « voici ce qui est en vigueur ».
 */
export async function contraintes(): Promise<Contrainte[]> {
  return sql<Contrainte[]>`
    SELECT rel.relname AS table,
           con.conname AS nom,
           CASE con.contype
             WHEN 'c' THEN 'vérification'
             WHEN 'u' THEN 'unicité'
             WHEN 'p' THEN 'clé primaire'
             WHEN 'f' THEN 'clé étrangère'
             ELSE con.contype::text
           END AS genre,
           pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     WHERE ns.nspname = 'public'
     ORDER BY rel.relname, con.contype DESC, con.conname
  `;
}

export type Index = { table: string; nom: string; definition: string };

export async function indexes(): Promise<Index[]> {
  return sql<Index[]>`
    SELECT tablename AS table, indexname AS nom, indexdef AS definition
      FROM pg_indexes
     WHERE schemaname = 'public'
     ORDER BY tablename, indexname
  `;
}

export type Compteur = { table: string; lignes: number };

export async function compteurs(): Promise<Compteur[]> {
  return sql<Compteur[]>`
    SELECT 'users' AS table, count(*)::int AS lignes FROM users
    UNION ALL SELECT 'courses', count(*)::int FROM courses
    UNION ALL SELECT 'reviews', count(*)::int FROM reviews
    UNION ALL SELECT 'sessions', count(*)::int FROM sessions
    UNION ALL SELECT 'email_tokens', count(*)::int FROM email_tokens
    UNION ALL SELECT 'rate_limits', count(*)::int FROM rate_limits
    ORDER BY 1
  `;
}

/**
 * Preuve que les mots de passe ne sont pas stockés en clair.
 *
 * Seul le PRÉFIXE de l'empreinte est rendu : l'algorithme et ses paramètres.
 * Il ne contient ni sel complet, ni empreinte, et n'aide en rien à retrouver
 * un mot de passe — mais il montre exactement ce qui protège les comptes.
 */
export async function empreintesMotDePasse(): Promise<{ prefixe: string; comptes: number }[]> {
  return sql<{ prefixe: string; comptes: number }[]>`
    SELECT substring(password_hash from 1 for 31) AS prefixe, count(*)::int AS comptes
      FROM users
     GROUP BY 1
     ORDER BY 2 DESC
  `;
}

/**
 * Recalcule les moyennes affichées sur le site, par une requête écrite ici et
 * lisible ici. Les deux chiffres viennent de la même base : s'ils divergeaient,
 * ce serait visible immédiatement.
 */
export async function verificationMoyennes(): Promise<
  { cours: string; notes_deposees: string; nombre: number; moyenne: number | null }[]
> {
  return sql`
    SELECT c.nom AS cours,
           coalesce(string_agg(r.note::text, ' + ' ORDER BY r.note DESC), '—') AS notes_deposees,
           count(r.id)::int AS nombre,
           round(avg(r.note), 1)::float8 AS moyenne
      FROM courses c
      LEFT JOIN reviews r ON r.course_id = c.id
     GROUP BY c.id, c.nom
     ORDER BY count(r.id) DESC, c.nom
  `;
}

/** Tentatives d'écriture interdites, rejouées EN DIRECT contre la base. */
export type Epreuve = { intitule: string; instruction: string; resultat: string; refuse: boolean };

export async function epreuvesDIntegrite(): Promise<Epreuve[]> {
  const essais: { intitule: string; instruction: string }[] = [
    {
      intitule: 'Déposer une note de 9 sur 5',
      instruction:
        "INSERT INTO reviews (user_id, course_id, note, commentaire) SELECT u.id, c.id, 9, 'texte assez long pour passer' FROM users u, courses c LIMIT 1",
    },
    {
      intitule: 'Déposer une note de 0',
      instruction:
        "INSERT INTO reviews (user_id, course_id, note, commentaire) SELECT u.id, c.id, 0, 'texte assez long pour passer' FROM users u, courses c LIMIT 1",
    },
    {
      intitule: 'Déposer un avis de 3 caractères',
      instruction:
        "INSERT INTO reviews (user_id, course_id, note, commentaire) SELECT u.id, c.id, 4, 'ok' FROM users u, courses c LIMIT 1",
    },
    {
      intitule: 'Noter deux fois le même cours',
      instruction:
        "INSERT INTO reviews (user_id, course_id, note, commentaire) SELECT r.user_id, r.course_id, 5, 'un deuxième avis de la même personne' FROM reviews r LIMIT 1",
    },
    {
      intitule: 'Créer un compte avec un rôle inventé',
      instruction:
        "INSERT INTO users (email, password_hash, role) VALUES ('essai-coulisses@exemple.fr', 'x', 'super-admin')",
    },
    {
      intitule: 'Créer deux comptes sur la même adresse (casse différente)',
      instruction:
        "INSERT INTO users (email, password_hash) SELECT upper(email::text), 'x' FROM users LIMIT 1",
    },
  ];

  const resultats: Epreuve[] = [];

  for (const essai of essais) {
    try {
      // ⚠️ Chaque tentative tourne dans une transaction ANNULÉE quoi qu'il
      // arrive : cette page ne modifie jamais rien. Si une contrainte venait à
      // manquer, l'écriture réussirait — et le ROLLBACK la retirerait aussitôt,
      // mais la page afficherait « ACCEPTÉE », ce qui est précisément l'alerte.
      await sql.begin(async (tx) => {
        await tx.unsafe(essai.instruction);
        throw new Error('__annulation_voulue__');
      });
      resultats.push({ ...essai, resultat: '⚠️ ACCEPTÉE — aucune contrainte ne s’y oppose', refuse: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message === '__annulation_voulue__') {
        resultats.push({ ...essai, resultat: '⚠️ ACCEPTÉE — aucune contrainte ne s’y oppose', refuse: false });
      } else {
        resultats.push({ ...essai, resultat: `Refusée par la base — ${premiereLigne(message)}`, refuse: true });
      }
    }
  }

  return resultats;
}

function premiereLigne(texte: string): string {
  return (texte.split('\n')[0] ?? texte).slice(0, 160);
}
