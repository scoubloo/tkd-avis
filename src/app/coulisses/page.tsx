import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Coulisses' };

const DECISIONS = [
  {
    question: 'Comment les mots de passe sont-ils protégés ?',
    choix: 'argon2id, 19 Mio de mémoire, 2 passes, 1 fil.',
    pourquoi:
      "C'est la recommandation actuelle de l'OWASP. Le coût en mémoire est ce qui rend une attaque par carte graphique chère : le baisser pour « aller plus vite » revient à retirer la serrure.",
    ecarte:
      'MD5 et SHA-1 (cassés), SHA-256 nu (trop rapide, donc trop facile à attaquer en masse), bcrypt (correct, mais argon2id est le défaut recommandé aujourd’hui).',
  },
  {
    question: 'Que se passe-t-il si quelqu’un vole une copie de la base ?',
    choix:
      'Les jetons de session et les liens reçus par e-mail ne sont pas stockés : seule leur empreinte SHA-256 l’est.',
    pourquoi:
      "Avec une copie de la base, personne ne peut se faire passer pour un utilisateur connecté ni rejouer un lien de confirmation : il faudrait inverser un SHA-256.",
    ecarte:
      'Stocker le jeton tel quel — c’est le défaut le plus courant, et il transforme une fuite de base en usurpation immédiate de toutes les sessions.',
  },
  {
    question: 'Un non-administrateur qui tape /admin, que voit-il ?',
    choix: 'Une page 404, pas une page « accès interdit ».',
    pourquoi:
      "Répondre « interdit » confirme que la page existe. Un 404 ne dit rien à quelqu'un qui tâtonne des URL.",
    ecarte:
      'Le 403, plus intuitif mais bavard. Et un contrôle posé une seule fois dans la mise en page : chaque page et chaque action le refont pour leur compte, car une action serveur s’appelle sans jamais ouvrir la page.',
  },
  {
    question: 'Peut-on savoir, depuis le site, si une adresse est déjà inscrite ?',
    choix:
      'Non. L’inscription, la connexion et le mot de passe oublié répondent exactement la même chose dans tous les cas.',
    pourquoi:
      "Sinon le formulaire devient un détecteur de comptes : on saisit mille adresses, on note celles qui répondent « déjà utilisée », et on obtient une liste à hameçonner. Le temps de réponse est égalisé lui aussi — un compte inexistant fait quand même le calcul complet, sans quoi le chronomètre suffirait à trahir la réponse.",
    ecarte:
      '« Cette adresse est déjà utilisée », qui aide l’utilisateur… et tous les autres. Le titulaire de l’adresse, lui, reçoit un e-mail l’avertissant de la tentative.',
  },
  {
    question: 'Comment empêcher une personne de noter vingt fois le même cours ?',
    choix:
      'Une contrainte d’unicité dans la base sur le couple (personne, cours). Un second dépôt modifie l’avis au lieu d’en créer un autre.',
    pourquoi:
      'Une vérification faite seulement dans le code se contourne dès qu’une requête arrive par un autre chemin, et perd la course quand deux envois partent en même temps. La base, elle, ne se contourne pas.',
    ecarte: 'Un contrôle « est-ce que cet avis existe déjà ? » avant d’écrire — vulnérable au double clic.',
  },
  {
    question: 'Où sont stockées les moyennes ?',
    choix: 'Nulle part. Elles sont recalculées à chaque lecture.',
    pourquoi:
      'Un total gardé à côté du détail finit toujours par diverger de ce qu’il résume, et personne ne s’en aperçoit avant qu’un utilisateur le signale.',
    ecarte:
      'Une colonne « moyenne » mise à jour à chaque avis — plus rapide, et fausse le jour où une mise à jour échoue.',
  },
  {
    question: 'Comment devient-on administrateur ?',
    choix: 'Par une commande lancée sur le serveur. Aucun chemin depuis le site.',
    pourquoi:
      'Tout mécanisme accessible depuis le web finit par être essayé. Ici, il faut déjà avoir un accès à la machine — auquel cas la question ne se pose plus.',
    ecarte:
      'Une case à cocher à l’inscription, un code secret, ou « le premier inscrit devient administrateur » : les trois se contournent.',
  },
  {
    question: 'Que voit un visiteur de l’adresse e-mail des autres ?',
    choix: 'Rien. Les avis sont signés « Membre ».',
    pourquoi:
      "Une première version affichait l’adresse partiellement masquée. Une revue a montré que c’était la mauvaise réponse à la bonne question : le masque gardait la première lettre, la dernière et le domaine entier — et surtout, le service n’a aucun besoin d’afficher une adresse. On ne masque pas mieux une donnée inutile : on ne la publie pas.",
    ecarte: 'Le masque « m•••••t@exemple.fr », qui donne une impression de prudence sans en être une.',
  },
];

const PANNES = [
  {
    titre: 'Un fichier invisible cassait les migrations',
    recit:
      'Le transfert vers le serveur déposait un fichier macOS « ._0001_initial.sql » : 163 octets binaires, la même extension que la vraie migration, et trié AVANT elle. PostgreSQL répondait « invalid message format », un message qui ne désigne rien — il envoie chercher du côté du pilote, du protocole, de l’encodage.',
    lecon:
      'Le répertoire distant est maintenant vidé avant chaque envoi, et le script de migration ignore ces fichiers.',
  },
  {
    titre: 'Une requête sur deux partait dans le vide',
    recit:
      'Le conteneur est branché sur deux réseaux. Sans indication, le routeur choisissait une adresse au hasard entre les deux, dont une où il n’est pas connecté. Le symptôme désignait le mauvais coupable : la sonde de santé répondait 200 pendant que la page d’accueil expirait — alors que l’application servait cette page en 137 ms quand on l’interrogeait de l’intérieur.',
    lecon:
      'Devant ce genre d’écart, interroger l’application depuis son propre conteneur tranche en trente secondes.',
  },
  {
    titre: 'Un avis daté de la veille',
    recit:
      'Le serveur est réglé sur l’heure universelle. Entre minuit et deux heures du matin, un avis déposé s’affichait daté du jour précédent. Le défaut n’apparaît jamais pendant qu’on développe, et toujours chez l’utilisateur.',
    lecon: 'Le fuseau d’affichage est désormais imposé, il n’est plus hérité de la machine.',
  },
  {
    titre: 'Mes propres vérifications ont menti deux fois',
    recit:
      'Le contrôle de mise en ligne faisait deux requêtes distinctes et comparait le corps de la première au code de la seconde : pendant un redémarrage, il déclarait la page vide alors qu’elle allait bien. Et les tests automatisés perdaient le sous-chemin de l’application à chaque navigation, accusant le site d’un défaut qui était le leur.',
    lecon:
      'Un échec massif et parfaitement uniforme est presque toujours l’instrument de mesure, pas ce qu’il mesure.',
  },
];

export default function Coulisses() {
  return (
    <div>
      <h1>Coulisses</h1>
      <p className="chapeau">
        Cette section existe pour être vérifiée, pas pour être crue. Elle montre les décisions et
        leurs raisons, le code réellement exécuté, la base de données lue en direct, et les pannes
        rencontrées en route.
      </p>

      <div className="grille" style={{ margin: '1.5rem 0 2.5rem' }}>
        <Link href="/coulisses/base" className="carte cours-carte">
          <span className="cours-carte__nom">La base de données</span>
          <p className="cours-carte__meta">
            Le schéma, les contraintes et les index lus dans PostgreSQL au moment où vous ouvrez la
            page. Six écritures interdites sont tentées en direct devant vous.
          </p>
        </Link>
        <Link href="/coulisses/code" className="carte cours-carte">
          <span className="cours-carte__nom">Le code</span>
          <p className="cours-carte__meta">
            Tous les fichiers, lisibles ligne à ligne. Ce sont ceux que le serveur exécute, pas des
            copies déposées à côté.
          </p>
        </Link>
        <Link href="/coulisses/preuves" className="carte cours-carte">
          <span className="cours-carte__nom">Les preuves</span>
          <p className="cours-carte__meta">
            L’historique des modifications, les tests, et chaque exigence en face de ce qui l’atteste.
          </p>
        </Link>
      </div>

      <h2>Les décisions, et ce qui a été écarté</h2>
      <div className="pile moyen">
        {DECISIONS.map((d) => (
          <article key={d.question} className="carte">
            <h3 style={{ marginBottom: '.6rem' }}>{d.question}</h3>
            <p style={{ margin: '0 0 .6rem' }}>
              <strong>Choix :</strong> {d.choix}
            </p>
            <p style={{ margin: '0 0 .6rem' }}>
              <strong>Pourquoi :</strong> {d.pourquoi}
            </p>
            <p className="champ__aide" style={{ margin: 0 }}>
              <strong>Écarté :</strong> {d.ecarte}
            </p>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: '2.5rem' }}>Ce qui a cassé en route</h2>
      <p className="moyen">
        Ces quatre pannes sont écrites parce qu&apos;elles disent plus sur la manière de travailler
        que la liste des fonctionnalités. Aucune n&apos;a été trouvée en relisant le code : toutes
        l&apos;ont été en vérifiant sur la machine réelle.
      </p>
      <div className="pile moyen">
        {PANNES.map((p) => (
          <article key={p.titre} className="carte">
            <h3 style={{ marginBottom: '.6rem' }}>{p.titre}</h3>
            <p style={{ margin: '0 0 .6rem' }}>{p.recit}</p>
            <p className="champ__aide" style={{ margin: 0 }}>
              <strong>Ce qui a été mis en place :</strong> {p.lecon}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
