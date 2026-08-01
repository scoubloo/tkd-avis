import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Mentions légales' };

/**
 * Mentions légales — art. 1-1 de la LCEN dans sa version issue de la loi SREN
 * du 21 mai 2024 (et non l'ancien art. 6-III, abrogé).
 *
 * L'éditeur est une personne physique non professionnelle : la loi lui permet
 * de ne pas publier son adresse, à condition que l'hébergeur, lui, la connaisse.
 */
export default function MentionsLegales() {
  return (
    <div className="texte-legal">
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        Ce site est édité à titre personnel et non professionnel par <strong>Liam</strong>, dans le
        cadre d&apos;un exercice de développement.
        <br />
        Contact : <a href="mailto:liam.chea09@gmail.com">liam.chea09@gmail.com</a>
      </p>
      <p>
        Conformément à l&apos;article 1-1 de la loi pour la confiance dans l&apos;économie numérique,
        une personne physique éditant un service à titre non professionnel peut ne pas publier son
        adresse. Celle-ci est en revanche connue de l&apos;hébergeur, qui peut la communiquer à
        l&apos;autorité judiciaire.
      </p>

      <h2>Hébergement</h2>
      <p>
        Hostinger International Ltd — 61 Lordou Vironos Street, 6023 Larnaca, Chypre.
        <br />
        Serveur situé dans l&apos;Union européenne.
      </p>

      <h2>Nature du service</h2>
      <p>
        Il s&apos;agit d&apos;une <strong>application de démonstration</strong>. Les cours, les
        professeurs, les horaires et le lieu présentés sont <strong>fictifs</strong> : ils ne
        désignent aucun club, aucune association et aucune personne réelle. Aucun service n&apos;est
        vendu, aucun paiement n&apos;est collecté.
      </p>

      <h2>Avis publiés</h2>
      <p>
        Les avis sont rédigés par les personnes inscrites. Ils ne sont ni achetés, ni sollicités, ni
        rémunérés, et aucun n&apos;est supprimé au motif qu&apos;il serait négatif. Chaque personne
        peut déposer un seul avis par cours, et le modifier ou le supprimer à tout moment depuis son
        compte.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le détail des données collectées, de leur durée de conservation et de vos droits est sur la
        page <Link href="/confidentialite">données personnelles</Link>.
      </p>

      <h2>Propriété</h2>
      <p>
        Le code de cette application a été écrit pour l&apos;exercice. Les textes déposés par les
        utilisateurs restent la propriété de leurs auteurs.
      </p>
    </div>
  );
}
