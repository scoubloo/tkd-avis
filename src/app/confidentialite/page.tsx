import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Données personnelles' };

export default function Confidentialite() {
  return (
    <div className="texte-legal">
      <h1>Données personnelles</h1>
      <p className="chapeau">
        Cette page dit exactement ce qui est conservé, pourquoi, combien de temps, et comment tout
        récupérer ou tout effacer. Les deux derniers points sont des boutons dans votre compte, pas
        une adresse à qui écrire.
      </p>

      <h2>Qui est responsable</h2>
      <p>
        Liam, éditeur du site à titre personnel — <a href="mailto:liam.chea09@gmail.com">liam.chea09@gmail.com</a>.
        Voir les <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>Ce qui est collecté</h2>
      <ul>
        <li>
          <strong>Votre adresse e-mail</strong> — pour créer le compte, confirmer qu&apos;elle vous
          appartient et vous reconnecter.
        </li>
        <li>
          <strong>Une empreinte de votre mot de passe</strong> (argon2id). Le mot de passe lui-même
          n&apos;est stocké nulle part et ne peut pas être retrouvé, y compris par l&apos;éditeur.
        </li>
        <li>
          <strong>Vos avis</strong> — la note et le texte que vous écrivez, avec leur date.
        </li>
        <li>
          <strong>Des compteurs anti-abus</strong> — nombre de tentatives de connexion par adresse
          IP, conservés au maximum une heure.
        </li>
      </ul>
      <p>
        Il n&apos;y a <strong>ni traceur, ni statistique de fréquentation, ni publicité, ni
        service tiers</strong> chargé dans les pages.
      </p>

      <h2>Sur quelle base</h2>
      <ul>
        <li>
          Compte et publication des avis : <strong>exécution du service</strong> que vous demandez
          en vous inscrivant (art. 6.1.b du RGPD).
        </li>
        <li>
          Confirmation de l&apos;adresse et limitation des tentatives :{' '}
          <strong>intérêt légitime</strong> à ne pas laisser créer de faux comptes ni deviner des
          mots de passe (art. 6.1.f).
        </li>
      </ul>

      <h2>Qui y a accès</h2>
      <ul>
        <li>
          <strong>Les autres visiteurs</strong> voient votre note et votre texte, et votre adresse
          e-mail <em>partiellement masquée</em> (par exemple « m•••••••t@exemple.fr »).
        </li>
        <li>
          <strong>Les administrateurs</strong> du site voient les adresses e-mail complètes dans le
          back-office. C&apos;est nécessaire pour modérer, et c&apos;est écrit ici plutôt que caché.
        </li>
        <li>
          <strong>Google (Gmail)</strong> achemine les e-mails de confirmation : à ce titre, votre
          adresse transite par ses serveurs, situés en partie hors de l&apos;Union européenne. Aucun
          autre destinataire.
        </li>
      </ul>

      <h2>Combien de temps</h2>
      <ul>
        <li>
          <strong>Compte non confirmé : supprimé automatiquement au bout de 7 jours</strong>, avec
          tout ce qui s&apos;y rattache.
        </li>
        <li>Compte confirmé et vos avis : conservés tant que vous gardez le compte.</li>
        <li>Sessions : 30 jours, puis effacement automatique.</li>
        <li>Liens de confirmation : 24 heures.</li>
        <li>Compteurs anti-abus : une heure au maximum.</li>
      </ul>

      <h2>Vos droits</h2>
      <p>Depuis la page <Link href="/mon-compte">Mon compte</Link>, sans rien demander à personne :</p>
      <ul>
        <li>
          <strong>Récupérer toutes vos données</strong> dans un fichier lisible (droits d&apos;accès
          et de portabilité, art. 15 et 20).
        </li>
        <li>
          <strong>Modifier ou supprimer chacun de vos avis</strong> (droit de rectification, art. 16).
        </li>
        <li>
          <strong>Supprimer votre compte</strong> définitivement, avec tous vos avis (droit à
          l&apos;effacement, art. 17).
        </li>
      </ul>
      <p>
        Vous pouvez aussi écrire à l&apos;adresse ci-dessus, et introduire une réclamation auprès de
        la CNIL (<a href="https://www.cnil.fr" rel="noreferrer">cnil.fr</a>).
      </p>

      <h2>Cookies</h2>
      <p>
        Un seul cookie est déposé, et uniquement une fois connecté : celui qui vous garde connecté.
        Il est <strong>strictement nécessaire</strong> au service que vous demandez, ce qui le
        dispense de consentement — c&apos;est pourquoi aucun bandeau ne vous est imposé. Il ne sert
        à aucune mesure d&apos;audience et à aucun suivi.
      </p>

      <h2>Sécurité</h2>
      <ul>
        <li>Connexion chiffrée (HTTPS) sur tout le site.</li>
        <li>Mots de passe protégés par argon2id — la méthode recommandée aujourd&apos;hui.</li>
        <li>
          Jetons de session et liens e-mail stockés sous forme d&apos;empreinte : une copie de la
          base ne permettrait d&apos;usurper aucune session.
        </li>
        <li>Base de données inaccessible depuis Internet.</li>
      </ul>

      <p className="champ__aide">Dernière mise à jour : 2 août 2026.</p>
    </div>
  );
}
