import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Données personnelles' };

/**
 * ⚠️ Cette page ne doit contenir AUCUNE affirmation que le code ne tient pas.
 *
 * Une revue du 02/08/2026 y a trouvé quatre déclarations fausses — dont
 * « supprimé automatiquement » alors qu'aucune tâche n'exécutait le ménage.
 * Une politique de confidentialité inexacte est un manquement à l'art. 5.1.a du
 * RGPD, pas une maladresse de rédaction.
 *
 * Règle de maintenance : toute modification d'une durée ici doit être faite en
 * même temps que dans `scripts/purge.mjs`, et l'inverse.
 */
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
        Liam, éditeur du site à titre personnel —{' '}
        <a href="mailto:liam.chea09@gmail.com">liam.chea09@gmail.com</a>. Voir les{' '}
        <Link href="/mentions-legales">mentions légales</Link>.
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
          <strong>Des compteurs anti-abus.</strong> Ils comptent les tentatives par appareil et par
          adresse e-mail, mais ne stockent <strong>ni votre adresse IP ni votre e-mail</strong> :
          seulement une empreinte irréversible qui ne sert qu&apos;à compter.
        </li>
      </ul>
      <p>
        Il n&apos;y a <strong>ni traceur, ni statistique de fréquentation, ni publicité, ni service
        tiers</strong> chargé dans les pages. Votre adresse e-mail n&apos;est{' '}
        <strong>jamais affichée publiquement</strong>, même partiellement : les avis sont signés
        « Membre ».
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
          mots de passe (art. 6.1.f). Vous pouvez vous y opposer (voir « Vos droits »).
        </li>
      </ul>

      <h2>Qui y a accès</h2>
      <ul>
        <li>
          <strong>Les autres visiteurs</strong> voient votre note et votre texte, signés
          « Membre ». Aucune adresse e-mail n&apos;apparaît.
        </li>
        <li>
          <strong>Les administrateurs</strong> du site voient les adresses e-mail complètes dans le
          back-office. C&apos;est écrit ici plutôt que caché.
        </li>
        <li>
          <strong>Hostinger</strong> héberge le serveur et la base (société chypriote, serveur situé
          dans l&apos;Union européenne). Il n&apos;accède pas au contenu dans le cours normal du
          service.
        </li>
        <li>
          <strong>Google (Gmail)</strong> envoie les e-mails de confirmation. À ce titre votre
          adresse est traitée sur ses serveurs, en partie hors de l&apos;Union européenne, et{' '}
          <strong>une copie de chaque message envoyé reste dans la boîte d&apos;envoi de
          l&apos;éditeur</strong> — y compris après la suppression de votre compte. C&apos;est la
          limite connue de ce montage, et elle est écrite ici parce qu&apos;elle est réelle.
        </li>
      </ul>

      <h2>Combien de temps</h2>
      <ul>
        <li>
          <strong>Compte non confirmé : supprimé au bout de 7 jours</strong>, avec tout ce qui
          s&apos;y rattache. Un ménage automatique passe chaque nuit.
        </li>
        <li>Compte confirmé et vos avis : conservés tant que vous gardez le compte.</li>
        <li>Sessions : 30 jours, puis suppression au ménage suivant.</li>
        <li>
          Liens de confirmation : <strong>valables 24 heures</strong> ; la trace du lien (une
          empreinte, jamais le lien) est effacée au plus tard 7 jours après.
        </li>
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
      <p>En écrivant à l&apos;adresse ci-dessus :</p>
      <ul>
        <li>
          <strong>vous opposer</strong> à un traitement fondé sur l&apos;intérêt légitime (art. 21) ;
        </li>
        <li>
          <strong>demander la limitation</strong> d&apos;un traitement (art. 18) ;
        </li>
        <li>
          <strong>faire corriger votre adresse e-mail</strong>, qui n&apos;est pas modifiable depuis
          le site.
        </li>
      </ul>
      <p>
        Vous pouvez aussi introduire une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr" rel="noreferrer">cnil.fr</a>).
      </p>

      <h2>Cookies</h2>
      <p>
        Un seul cookie est déposé, et uniquement une fois connecté :{' '}
        <code>__Secure-tkd_session</code>, valable 30 jours, qui vous garde connecté. Il est{' '}
        <strong>strictement nécessaire</strong> au service que vous demandez, ce qui le dispense de
        consentement — c&apos;est pourquoi aucun bandeau ne vous est imposé. Il ne sert à aucune
        mesure d&apos;audience et à aucun suivi.
      </p>

      <h2>Âge</h2>
      <p>
        Ce service s&apos;adresse aux personnes de <strong>15 ans et plus</strong>. En dessous,
        demandez à un parent de créer le compte.
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
