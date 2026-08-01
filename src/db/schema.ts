import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Reflet TypeScript du schéma SQL de `db/migrations/`.
 *
 * ⚠️ La source de vérité reste le SQL. Ce fichier ne crée rien : il décrit ce
 * que les migrations ont créé, pour que les requêtes soient typées. Le test
 * `tests/integration/schema.test.ts` vérifie que les deux ne divergent pas.
 */

const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: citext('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('membre').$type<'membre' | 'admin'>(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const emailTokens = pgTable(
  'email_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull().$type<'confirmation' | 'reinitialisation'>(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('email_tokens_user_purpose_idx').on(t.userId, t.purpose)],
);

export const sessions = pgTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  nom: text('nom').notNull(),
  professeur: text('professeur').notNull(),
  jour: smallint('jour').notNull(),
  heure: time('heure').notNull(),
  dureeMin: smallint('duree_min').notNull(),
  niveau: text('niveau').notNull(),
  lieu: text('lieu').notNull(),
  actif: boolean('actif').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    note: smallint('note').notNull(),
    commentaire: text('commentaire').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('reviews_user_id_course_id_key').on(t.userId, t.courseId),
    index('reviews_course_idx').on(t.courseId),
  ],
);

export const rateLimits = pgTable('rate_limits', {
  cle: text('cle').primaryKey(),
  compteur: integer('compteur').notNull().default(0),
  fenetreFin: timestamp('fenetre_fin', { withTimezone: true }).notNull(),
});

export type Utilisateur = typeof users.$inferSelect;
export type Cours = typeof courses.$inferSelect;
export type Avis = typeof reviews.$inferSelect;
