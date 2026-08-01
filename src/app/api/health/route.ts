import { NextResponse } from 'next/server';
import { sql } from '@/db';

export const dynamic = 'force-dynamic';

/**
 * Sonde de santé, lue par le `healthcheck` du conteneur et par la surveillance
 * du VPS.
 *
 * Elle interroge réellement la base : une application qui répond « je vais
 * bien » alors que sa base est injoignable est exactement le genre de sonde qui
 * laisse une panne durer six jours.
 *
 * Elle ne divulgue rien : ni version, ni nom de base, ni message d'erreur.
 */
export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ etat: 'ok' }, { status: 200 });
  } catch {
    return NextResponse.json({ etat: 'base injoignable' }, { status: 503 });
  }
}
