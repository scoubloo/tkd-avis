'use server';

import { redirect } from 'next/navigation';
import { detruireSession } from '@/lib/auth/session';

export async function deconnexion(): Promise<never> {
  await detruireSession();
  redirect('/');
}
