# Mot de passe oublié — débranché le 02/08/2026

Fonctionnalité complète et testée, retirée parce que le cahier des charges ne la
demande pas. Elle avait été ajoutée après que le commanditaire ait vu
l'application.

## Ce qu'elle faisait

Une personne qui a perdu son mot de passe demandait un lien par e-mail et en
choisissait un nouveau. Trois propriétés valaient le détour, à ne pas reperdre
si on rebranche :

- **la réponse est la même que l'adresse existe ou non** — sinon le formulaire
  devient un détecteur de comptes ;
- **ouvrir le lien ne le consomme pas** — une messagerie qui pré-charge les
  liens brûlerait la demande avant que la personne clique ;
- **toutes les sessions ouvertes sont fermées** au changement de mot de passe —
  on change son mot de passe justement quand on craint qu'un autre y ait accès.

## Remise en service — les six gestes

1. `git mv hors-perimetre/mot-de-passe-oublie/ecrans/mot-de-passe-oublie src/app/mot-de-passe-oublie`
2. `git mv hors-perimetre/mot-de-passe-oublie/ecrans/reinitialisation src/app/reinitialisation`
3. `git mv hors-perimetre/mot-de-passe-oublie/lib/motdepasse.ts src/lib/actions/motdepasse.ts`
4. Recoller les trois extraits de `extraits/` dans `src/lib/validation.ts`,
   `src/lib/mail.ts` et `src/lib/auth/session.ts` (chaque fichier dit où).
5. Rétablir dans `src/lib/ratelimit.ts` l'entrée retirée avec eux :
   ```ts
   motDePasseOublie: { limite: 3, fenetreMs: 60 * 60 * 1000 },
   ```
6. Remettre le lien sur la page de connexion (`src/app/connexion/page.tsx`) :
   ```tsx
   <p style={{ marginTop: '1.25rem' }}>
     <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
   </p>
   ```
   ainsi que le message de succès affiché au retour, que la page portait sous
   `searchParams.reinitialise === '1'` (il est dans l'historique git, au commit
   qui précède le retrait).

Puis recoller `tests/parcours-oubli.spec.ts` dans `tests/e2e/parcours.spec.ts`
et son aide dans `tests/e2e/aide.ts`, et lancer :

```bash
npm run verify && ./tests/e2e/lancer.sh
```

## Ce qui n'a PAS été retiré, et qui les attend

- la colonne `purpose` de la table `email_tokens` accepte toujours la valeur
  `'reinitialisation'` (aucune migration à rejouer) ;
- `creerJeton`, `empreinte`, `dansMs` et `DUREE_JETON_EMAIL_MS` dans
  `src/lib/auth/tokens.ts`, encore utilisés par l'inscription.

En revanche `detruireToutesLesSessions` est parti avec la fonctionnalité : plus
rien ne l'appelait, et une fonction exportée que personne n'appelle est
exactement le genre de chose qu'un relecteur signale. Elle est dans
`extraits/session.detruireToutesLesSessions.ts`.
