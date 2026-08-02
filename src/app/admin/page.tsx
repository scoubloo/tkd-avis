import { redirect } from 'next/navigation';
import { exigerAdmin } from '@/lib/auth/require';

/**
 * `/admin` n'est plus un écran, seulement une porte.
 *
 * Le cahier des charges demande TROIS écrans d'administration : la liste des
 * utilisateurs, la liste des cours, la fiche d'un cours. Un tableau de bord et
 * ses cinq compteurs en faisaient un quatrième, que personne n'avait demandé —
 * retiré le 02/08/2026.
 *
 * ⚠️ `exigerAdmin()` passe AVANT la redirection, et pas l'inverse : sinon un
 * visiteur non administrateur serait renvoyé vers `/admin/utilisateurs`, ce qui
 * lui apprendrait que cette adresse existe. Ici il reçoit 404, comme partout
 * ailleurs dans le back-office.
 */
export default async function AdminAccueil() {
  await exigerAdmin();
  redirect('/admin/utilisateurs');
}
