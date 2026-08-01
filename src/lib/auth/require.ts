import { notFound, redirect } from 'next/navigation';
import type { Utilisateur } from '@/db/schema';
import { lireSession } from './session';

/**
 * Gardes d'accès.
 *
 * ⚠️ Elles sont appelées DANS chaque page et chaque action serveur, jamais
 * seulement dans une mise en page ou un `middleware`. Un contrôle posé au seul
 * niveau de la mise en page se contourne dès qu'une action serveur est appelée
 * directement — c'est le grand classique des back-offices percés.
 */

export async function exigerUtilisateur(): Promise<Utilisateur> {
  const utilisateur = await lireSession();
  if (!utilisateur) redirect('/connexion');
  return utilisateur;
}

export async function exigerUtilisateurConfirme(): Promise<Utilisateur> {
  const utilisateur = await exigerUtilisateur();
  if (!utilisateur.emailVerifiedAt) redirect('/confirmation/en-attente');
  return utilisateur;
}

/**
 * Réservé aux administrateurs.
 *
 * Un non-administrateur reçoit **404**, pas 403 : répondre « interdit »
 * confirmerait l'existence de l'espace d'administration à quelqu'un qui ne fait
 * que tâtonner des URL.
 */
export async function exigerAdmin(): Promise<Utilisateur> {
  const utilisateur = await lireSession();
  if (!utilisateur || utilisateur.role !== 'admin' || !utilisateur.emailVerifiedAt) {
    notFound();
  }
  return utilisateur;
}
