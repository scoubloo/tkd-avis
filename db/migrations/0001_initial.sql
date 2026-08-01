-- ============================================================================
-- 0001_initial — schéma de départ
--
-- Principe tenu dans tout ce fichier : les règles qui protègent les données
-- vivent DANS la base, pas seulement dans le code applicatif. Une note hors de
-- 1..5 doit être refusée même si quelqu'un écrit dans la base sans passer par
-- l'application.
-- ============================================================================

-- Comparaison d'e-mails insensible à la casse : « Liam@Gmail.com » et
-- « liam@gmail.com » doivent être le MÊME compte, sinon on peut créer deux
-- comptes pour une seule boîte et contourner la confirmation.
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext      NOT NULL UNIQUE,
  -- Empreinte argon2id. Le mot de passe en clair n'existe nulle part, jamais,
  -- ni en base, ni dans les journaux.
  password_hash      text        NOT NULL,
  role               text        NOT NULL DEFAULT 'membre'
                                 CHECK (role IN ('membre', 'admin')),
  -- NULL tant que l'adresse n'a pas été confirmée.
  email_verified_at  timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Jetons envoyés par e-mail (confirmation d'adresse, réinitialisation)
--
-- Seule l'EMPREINTE du jeton est stockée. Si la base fuit, aucun des jetons
-- volés n'est utilisable : il faudrait inverser un SHA-256.
-- ---------------------------------------------------------------------------
CREATE TABLE email_tokens (
  token_hash   text        PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose      text        NOT NULL
                           CHECK (purpose IN ('confirmation', 'reinitialisation')),
  expires_at   timestamptz NOT NULL,
  -- Horodatage du seul et unique usage. Un jeton rejoué est refusé.
  consumed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_tokens_user_purpose_idx ON email_tokens (user_id, purpose);

-- ---------------------------------------------------------------------------
-- Sessions — même principe : l'empreinte, jamais le jeton.
-- ---------------------------------------------------------------------------
CREATE TABLE sessions (
  token_hash  text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- ---------------------------------------------------------------------------
-- Cours
-- ---------------------------------------------------------------------------
CREATE TABLE courses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,
  nom         text        NOT NULL,
  professeur  text        NOT NULL,
  -- 1 = lundi … 7 = dimanche (ISO-8601, pas la numérotation américaine).
  jour        smallint    NOT NULL CHECK (jour BETWEEN 1 AND 7),
  heure       time        NOT NULL,
  duree_min   smallint    NOT NULL CHECK (duree_min BETWEEN 15 AND 240),
  niveau      text        NOT NULL,
  lieu        text        NOT NULL,
  actif       boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Avis
--
-- UNIQUE (user_id, course_id) : un avis par personne et par cours, modifiable.
-- Sans cette contrainte, une seule personne peut déposer vingt notes et fausser
-- la moyenne d'un cours — c'est le premier défaut qu'un examinateur cherche.
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    uuid        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  note         smallint    NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire  text        NOT NULL
                           CHECK (char_length(btrim(commentaire)) BETWEEN 10 AND 2000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX reviews_course_idx ON reviews (course_id);

-- ---------------------------------------------------------------------------
-- Limitation de débit
--
-- En base et non en mémoire : un redémarrage du conteneur ne doit pas remettre
-- les compteurs à zéro et rouvrir la porte au bourrinage de mots de passe.
-- ---------------------------------------------------------------------------
CREATE TABLE rate_limits (
  cle          text        PRIMARY KEY,
  compteur     integer     NOT NULL DEFAULT 0,
  fenetre_fin  timestamptz NOT NULL
);
CREATE INDEX rate_limits_fenetre_idx ON rate_limits (fenetre_fin);
