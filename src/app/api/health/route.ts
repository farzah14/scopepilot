import { NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { checkDatabaseHealth } from '../../../health/database-health';

export async function GET() {
  try {
    await checkDatabaseHealth(db);
    return NextResponse.json({ status: 'ok', database: 'ok' });
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unavailable' }, { status: 503 });
  }
}
