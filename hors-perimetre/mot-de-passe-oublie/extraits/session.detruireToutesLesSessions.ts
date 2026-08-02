// Extrait de `src/lib/auth/session.ts`, retiré le 02/08/2026.
// À recoller à la fin de ce fichier. Seul `motdepasse.ts` l'appelait : c'est ce
// qui ferme toutes les sessions ouvertes quand le mot de passe change.

/** Invalide toutes les sessions d'un compte (changement de mot de passe). */
export async function detruireToutesLesSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
