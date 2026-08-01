import type { Metadata } from 'next';
import { exigerAdmin } from '@/lib/auth/require';
import { dateLisible, noteLisible } from '@/lib/format';
import { listerUtilisateurs } from '@/lib/requetes';

export const metadata: Metadata = { title: 'Utilisateurs' };

export default async function Utilisateurs() {
  await exigerAdmin();
  const lignes = await listerUtilisateurs();

  return (
    <>
      <h1>Utilisateurs</h1>
      <p className="chapeau">
        {lignes.length} compte{lignes.length > 1 ? 's' : ''}. Pour chacun : son adresse, le nombre
        de cours qu&apos;il a notés, et la moyenne des notes qu&apos;il a données.
      </p>

      <div className="tableau-cadre" style={{ marginTop: '1.5rem' }}>
        <table>
          <caption>
            Classés par nombre d&apos;avis, du plus actif au moins actif. La moyenne donnée est
            celle des notes déposées par la personne, pas celle qu&apos;elle a reçue.
          </caption>
          <thead>
            <tr>
              <th scope="col">Adresse e-mail</th>
              <th scope="col">Statut</th>
              <th scope="col" className="nombre">Cours notés</th>
              <th scope="col" className="nombre">Moyenne donnée</th>
              <th scope="col">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((u) => (
              <tr key={u.id}>
                {/* L'adresse complète est visible ici, et seulement ici : c'est
                    la raison pour laquelle la politique de confidentialité
                    mentionne explicitement l'accès des administrateurs. */}
                <th scope="row" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0, color: 'inherit' }}>
                  {u.email}
                </th>
                <td>
                  {u.role === 'admin' && <span className="etiquette etiquette--admin">admin</span>}
                  {!u.confirme && <span className="etiquette etiquette--attente">non confirmé</span>}
                  {u.role !== 'admin' && u.confirme && <span className="compte-avis">membre</span>}
                </td>
                <td className="nombre">{u.coursNotes}</td>
                <td className="nombre">{u.coursNotes > 0 ? noteLisible(u.moyenneDonnee) : '—'}</td>
                <td>{dateLisible(u.inscritLe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lignes.length === 0 && <p className="vide">Aucun compte pour le moment.</p>}
    </>
  );
}
