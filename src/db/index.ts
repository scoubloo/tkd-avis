import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * Accès à la base — construit à la PREMIÈRE requête, pas au chargement du module.
 *
 * Pourquoi c'est important : `next build` importe tous les modules pour analyser
 * les pages. Si la connexion se construisait au chargement, la construction de
 * l'image exigerait une base de données et une configuration complète — et
 * échouerait sur la machine d'un développeur qui veut seulement compiler.
 *
 * La validation de la configuration n'est pas perdue pour autant : elle a lieu
 * au démarrage du serveur, dans `src/instrumentation.ts`, avant la première
 * requête d'un visiteur.
 *
 * Le mandataire ci-dessous existe pour garder l'écriture naturelle (`db.select`,
 * sql`...`) sans disperser des appels de fonction dans tout le code.
 */

const cache = globalThis as unknown as {
  __tkdSql?: Sql;
  __tkdDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function instanceSql(): Sql {
  cache.__tkdSql ??= postgres(env().DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  return cache.__tkdSql;
}

function instanceDb() {
  cache.__tkdDb ??= drizzle(instanceSql(), { schema });
  return cache.__tkdDb;
}

/** Étiquette de gabarit : `sql\`SELECT 1\``. Le piège `apply` transmet l'appel. */
export const sql = new Proxy(function () {} as unknown as Sql, {
  apply: (_cible, _ceci, args) =>
    (instanceSql() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_cible, propriete) => Reflect.get(instanceSql(), propriete),
}) as Sql;

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get: (_cible, propriete) => {
    const valeur = Reflect.get(instanceDb(), propriete);
    // Les méthodes doivent rester liées à leur instance réelle.
    return typeof valeur === 'function' ? valeur.bind(instanceDb()) : valeur;
  },
});

export { schema };
