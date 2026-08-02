import type { Metadata } from 'next';
import Link from 'next/link';
import {
  colonnes,
  compteurs,
  contraintes,
  empreintesMotDePasse,
  epreuvesDIntegrite,
  indexes,
  verificationMoyennes,
} from '@/lib/coulisses';
import { noteLisible } from '@/lib/format';

export const metadata: Metadata = { title: 'La base de données' };
export const dynamic = 'force-dynamic';

export default async function Base() {
  const [cols, cons, idx, cpt, empreintes, moyennes, epreuves] = await Promise.all([
    colonnes(),
    contraintes(),
    indexes(),
    compteurs(),
    empreintesMotDePasse(),
    verificationMoyennes(),
    epreuvesDIntegrite(),
  ]);

  const tables = [...new Set(cols.map((c) => c.table))];
  const toutesRefusees = epreuves.every((e) => e.refuse);

  return (
    <div>
      <p className="fil">
        <Link href="/coulisses">Coulisses</Link> › La base de données
      </p>

      <h1>La base de données</h1>
      <p className="chapeau">
        Tout ce qui suit est <strong>lu dans PostgreSQL au moment où vous ouvrez cette page</strong>.
        Rien n&apos;est recopié à la main, rien n&apos;est une capture d&apos;écran : si une
        contrainte changeait en base, cette page l&apos;afficherait à la seconde suivante.
      </p>

      {/* ---------------------------------------------------------------- */}
      <h2>Les règles sont-elles vraiment appliquées ?</h2>
      <p>
        Six écritures interdites sont tentées <strong>en direct</strong>, à chaque affichage de cette
        page, dans une transaction systématiquement annulée. Rien n&apos;est modifié — mais on voit
        la base refuser.
      </p>

      <div className={`message message--${toutesRefusees ? 'succes' : 'erreur'}`} role="status">
        <p>
          {toutesRefusees
            ? `Les ${epreuves.length} tentatives ont été refusées par la base elle-même.`
            : 'Au moins une écriture interdite a été acceptée — voir le détail ci-dessous.'}
        </p>
      </div>

      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Tentative</th>
              <th scope="col">Réponse de PostgreSQL</th>
            </tr>
          </thead>
          <tbody>
            {epreuves.map((e) => (
              <tr key={e.intitule}>
                <th scope="row" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0 }}>
                  {e.intitule}
                </th>
                <td className="libre" style={{ color: e.refuse ? 'var(--succes)' : 'var(--alerte)' }}>
                  {e.resultat}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------------------- */}
      <h2 style={{ marginTop: '2.5rem' }}>Les mots de passe</h2>
      <p>
        Voici le <strong>début</strong> de ce qui est réellement stocké dans la colonne des mots de
        passe. On y lit l&apos;algorithme et ses réglages ; ni le sel entier, ni l&apos;empreinte ne
        sont affichés, et aucun mot de passe ne peut en être déduit.
      </p>
      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Début de l&apos;empreinte stockée</th>
              <th scope="col" className="nombre">Comptes</th>
            </tr>
          </thead>
          <tbody>
            {empreintes.map((e) => (
              <tr key={e.prefixe}>
                <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.86rem' }}>
                  {e.prefixe}…
                </td>
                <td className="nombre">{e.comptes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="champ__aide">
        <code>$argon2id$</code> est l&apos;algorithme, <code>m=19456</code> la mémoire en kibioctets,
        <code>t=2</code> le nombre de passes, <code>p=1</code> le nombre de fils — les valeurs
        recommandées par l&apos;OWASP.
      </p>

      {/* ---------------------------------------------------------------- */}
      <h2 style={{ marginTop: '2.5rem' }}>Les moyennes, recalculées ici</h2>
      <p>
        La colonne « notes déposées » est la liste brute. La moyenne est recalculée par la requête de
        cette page, indépendamment de celle qui alimente le site. Les deux doivent coïncider.
      </p>
      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Cours</th>
              <th scope="col">Notes déposées</th>
              <th scope="col" className="nombre">Nombre</th>
              <th scope="col" className="nombre">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {moyennes.map((m) => (
              <tr key={m.cours}>
                <th scope="row" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0 }}>
                  {m.cours}
                </th>
                <td>{m.notes_deposees}</td>
                <td className="nombre">{m.nombre}</td>
                <td className="nombre">{m.nombre > 0 ? noteLisible(m.moyenne) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------------------- */}
      <h2 style={{ marginTop: '2.5rem' }}>Les contraintes en vigueur</h2>
      <p>
        Lues par <code>pg_get_constraintdef</code> : c&apos;est le texte que la base applique, pas
        celui du fichier de migration.
      </p>
      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Table</th>
              <th scope="col">Genre</th>
              <th scope="col">Règle</th>
            </tr>
          </thead>
          <tbody>
            {cons.map((c) => (
              <tr key={`${c.table}-${c.nom}`}>
                <td>{c.table}</td>
                <td>{c.genre}</td>
                <td className="libre" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.84rem' }}>
                  {c.definition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------------------- */}
      <h2 style={{ marginTop: '2.5rem' }}>Les tables</h2>
      {tables.map((t) => (
        <section key={t} style={{ marginBottom: '1.5rem' }}>
          <h3>
            {t}{' '}
            <span className="compte-avis">
              — {cpt.find((c) => c.table === t)?.lignes ?? 0} ligne(s)
            </span>
          </h3>
          <div className="tableau-cadre">
            <table>
              <thead>
                <tr>
                  <th scope="col">Colonne</th>
                  <th scope="col">Type</th>
                  <th scope="col">Obligatoire</th>
                  <th scope="col">Valeur par défaut</th>
                </tr>
              </thead>
              <tbody>
                {cols
                  .filter((c) => c.table === t)
                  .map((c) => (
                    <tr key={c.nom}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.86rem' }}>{c.nom}</td>
                      <td>{c.type}</td>
                      <td>{c.obligatoire ? 'oui' : '—'}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.8rem' }}>
                        {c.defaut ?? '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* ---------------------------------------------------------------- */}
      <h2 style={{ marginTop: '2rem' }}>Les index</h2>
      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Table</th>
              <th scope="col">Définition</th>
            </tr>
          </thead>
          <tbody>
            {idx.map((i) => (
              <tr key={i.nom}>
                <td>{i.table}</td>
                <td className="libre" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.82rem' }}>
                  {i.definition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="champ__aide" style={{ marginTop: '2rem' }}>
        La base n&apos;est joignable depuis aucune adresse publique : elle n&apos;écoute que sur la
        boucle locale du serveur. Cette page est le seul chemin par lequel on peut la regarder, et
        elle est en lecture seule.
      </p>
    </div>
  );
}
