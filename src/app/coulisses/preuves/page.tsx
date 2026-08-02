import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Les preuves' };
export const dynamic = 'force-dynamic';

type Historique = {
  genere_le: string;
  commit: string;
  commits: { empreinte: string; date: string; titre: string }[];
  tests: { unitaires: number; bout_en_bout: number; echecs: number; date: string } | null;
};

async function historique(): Promise<Historique | null> {
  try {
    return JSON.parse(await readFile(join(process.cwd(), 'public', 'historique.json'), 'utf8'));
  } catch {
    return null;
  }
}

const EXIGENCES = [
  {
    demande: 'Inscription via e-mail et mot de passe',
    preuve: 'Formulaire d’inscription. Le mot de passe est haché en argon2id, jamais stocké en clair.',
    ou: '/inscription · preuve visible dans « La base de données »',
  },
  {
    demande: 'Confirmation du mail',
    preuve:
      'Un e-mail réel part à l’inscription. Le lien vaut 24 h et ne fonctionne qu’une fois : le second clic répond « C’était déjà fait », un lien inventé répond « Lien inconnu ».',
    ou: 'à essayer avec une vraie adresse',
  },
  {
    demande: 'Saisir un avis sur un cours : note sur 5 et description',
    preuve:
      'Note de 1 à 5 et texte de 10 à 2000 caractères. Les bornes sont appliquées par l’application ET par la base : une note de 9 est refusée même en écrivant directement en base.',
    ou: 'n’importe quelle page de cours · démonstration dans « La base de données »',
  },
  {
    demande: 'Admin — liste des utilisateurs : e-mail, nombre de cours notés, note moyenne donnée',
    preuve: 'Écran dédié. Les mêmes chiffres sont recalculés par une requête indépendante.',
    ou: '/admin/utilisateurs',
  },
  {
    demande: 'Admin — liste des cours avec le nombre de notes et la moyenne',
    preuve: 'Écran dédié, moyennes recalculées à la lecture.',
    ou: '/admin/cours',
  },
  {
    demande: 'Admin — fiche du cours avec la liste des notes et les descriptions',
    preuve: 'Écran dédié, avec en plus la répartition des notes.',
    ou: '/admin/cours/<cours>',
  },
];

const ESSAIS = [
  ['Ouvrir /admin sans être connecté', '404 — pas « accès interdit », qui confirmerait l’existence de la page'],
  ['Créer un compte, puis ouvrir /admin', '404 également : un membre ordinaire n’a aucun accès'],
  ['Cliquer deux fois le lien de confirmation', '« C’était déjà fait » — le lien ne sert qu’une fois'],
  ['Inventer un lien de confirmation', '« Lien inconnu »'],
  ['S’inscrire avec une adresse déjà utilisée', 'Le message est identique à celui d’une adresse neuve. Le titulaire reçoit un avertissement'],
  ['Se tromper six fois de mot de passe', 'Blocage temporaire, avec le délai restant annoncé'],
  ['Forcer une note à 0, 6 ou 4,5 avec les outils du navigateur', 'Refusée par le serveur : « La note va de 1 à 5 »'],
  ['Changer l’identifiant du cours dans le formulaire', '« Ce cours n’existe pas ou n’est plus proposé »'],
  ['Supprimer l’avis de quelqu’un d’autre', 'Impossible : la suppression est filtrée sur le compte connecté'],
  ['Demander un mot de passe oublié pour une adresse inconnue', 'Même réponse que pour un compte existant'],
];

export default async function Preuves() {
  const h = await historique();

  return (
    <div>
      <p className="fil">
        <Link href="/coulisses">Coulisses</Link> › Les preuves
      </p>

      <h1>Les preuves</h1>

      <h2>Chaque exigence, en face de ce qui l&apos;atteste</h2>
      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Demandé</th>
              <th scope="col">Ce qui le prouve</th>
              <th scope="col">Où</th>
            </tr>
          </thead>
          <tbody>
            {EXIGENCES.map((e) => (
              <tr key={e.demande}>
                <th scope="row" className="libre" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0, minWidth: '13rem' }}>
                  {e.demande}
                </th>
                <td className="libre">{e.preuve}</td>
                <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.82rem' }}>{e.ou}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '2.5rem' }}>Ce que vous pouvez essayer de casser</h2>
      <div className="tableau-cadre">
        <table>
          <thead>
            <tr>
              <th scope="col">Essayez</th>
              <th scope="col">Ce que répond l&apos;application</th>
            </tr>
          </thead>
          <tbody>
            {ESSAIS.map(([essai, reponse]) => (
              <tr key={essai}>
                <th scope="row" className="libre" style={{ fontWeight: 500, background: 'transparent', textTransform: 'none', fontSize: '.92rem', letterSpacing: 0 }}>
                  {essai}
                </th>
                <td className="libre">{reponse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '2.5rem' }}>Les tests</h2>
      {h?.tests ? (
        <div className="message message--succes" role="status">
          <p>
            <strong>{h.tests.unitaires} tests unitaires</strong> et{' '}
            <strong>{h.tests.bout_en_bout} tests de bout en bout</strong> (navigateur d&apos;ordinateur
            et profil téléphone), <strong>{h.tests.echecs} échec</strong>. Dernière exécution :{' '}
            {h.tests.date}.
          </p>
        </div>
      ) : (
        <p className="vide">Résultats non disponibles sur cette version.</p>
      )}
      <p>
        Les tests unitaires couvrent ce qui se calcule : mots de passe, jetons, moyennes, validation
        des saisies. Les tests de bout en bout jouent les vrais parcours dans un vrai navigateur —
        inscription, e-mail reçu, confirmation, dépôt d&apos;avis, mot de passe oublié — et les
        tentatives de contournement listées plus haut.
      </p>

      <h2 style={{ marginTop: '2.5rem' }}>L&apos;historique des modifications</h2>
      {h ? (
        <>
          <p>
            Version en ligne : <code>{h.commit}</code> · relevé le {h.genere_le}.
          </p>
          <div className="tableau-cadre">
            <table>
              <thead>
                <tr>
                  <th scope="col">Empreinte</th>
                  <th scope="col">Date</th>
                  <th scope="col">Ce qui a changé</th>
                </tr>
              </thead>
              <tbody>
                {h.commits.map((c) => (
                  <tr key={c.empreinte}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.82rem' }}>
                      {c.empreinte}
                    </td>
                    <td>{c.date}</td>
                    <td className="libre">{c.titre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="vide">Historique non disponible sur cette version.</p>
      )}

      <h2 style={{ marginTop: '2.5rem' }}>Ce qui n&apos;est pas fait</h2>
      <ul className="moyen">
        <li>
          <strong>Aucune modération depuis le back-office</strong> — les trois écrans demandés sont
          en lecture seule. Un avis se signale par e-mail, via les{' '}
          <Link href="/mentions-legales">mentions légales</Link>.
        </li>
        <li>
          <strong>Pas de sous-domaine dédié</strong> — l&apos;application partage son nom d&apos;hôte
          avec d&apos;autres démonstrations. Un sous-domaine isolerait mieux les sessions ; il demande
          un certificat, et le quota est contraint sur ce domaine.
        </li>
        <li>
          <strong>Les e-mails partent d&apos;un compte Gmail personnel</strong> — une copie de chaque
          message reste dans sa boîte d&apos;envoi. C&apos;est écrit dans la page{' '}
          <Link href="/confidentialite">Données personnelles</Link> plutôt que passé sous silence.
        </li>
        <li>
          <strong>Aucun plafond d&apos;inactivité</strong> — la date de dernière connexion n&apos;est
          pas enregistrée, donc les comptes dormants ne peuvent pas être purgés.
        </li>
      </ul>
    </div>
  );
}
