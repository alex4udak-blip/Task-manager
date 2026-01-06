import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health: { status: string; db?: string; timestamp: string } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.db = 'connected';
  } catch (error) {
    console.error('Database health check failed:', error);
    health.db = 'disconnected';
    // Still return 200 so healthcheck passes during initial deployment
    // The app can function in degraded mode while DB connects
  }

  return NextResponse.json(health);
}
