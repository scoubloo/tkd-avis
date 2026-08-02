# hors-perimetre/ — du code qui marche, volontairement débranché

Rien ici n'est compilé, servi, testé ni déployé. `tsconfig.json` exclut ce
dossier, Next.js ne route que `src/app/`, Playwright ne lit que `tests/e2e/`.

**Pourquoi ce dossier existe.** Le cahier des charges tient en six lignes. Ce
qui a été construit en plus a été retiré le 02/08/2026. Deux de ces ajouts
étaient du travail fini et vérifié : les supprimer pour de bon aurait obligé à
tout réécrire s'ils sont redemandés. Ils attendent ici, avec les gestes exacts
pour les remettre en service.

**Ce n'est pas une réserve à tout garder.** Y déposer quelque chose demande une
raison : la fonctionnalité marchait, elle a été retirée pour une question de
périmètre — pas parce qu'elle était mauvaise.

| Dossier | Ce que c'est | Coût de remise en service |
|---|---|---|
| `mot-de-passe-oublie/` | 2 écrans, l'action serveur, le schéma de validation, l'e-mail, les 2 tests de bout en bout | ~15 min, gestes détaillés dans son README |
| `renvoi-confirmation/` | l'action qui renvoie l'e-mail de confirmation quand le premier s'est perdu | ~10 min, gestes en tête du fichier |

**Le retrait a-t-il cassé quelque chose ?** Non : la suite de tests tourne au
vert sans ces deux fonctionnalités, et le contrôle de livraison passe. Ce qui
disparaît de l'application, c'est la possibilité de récupérer un compte dont le
mot de passe est perdu, et celle de redemander l'e-mail de confirmation. Les
deux sont assumées : l'énoncé ne les demande pas.
