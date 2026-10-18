import { NextResponse } from 'next/server';
import { getRecentWebhookEvents } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { serverError } from '@/lib/api';
import { getMpConfigStatus } from '@/lib/mercadopago';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const events = await getRecentWebhookEvents(80);
    const mpStatus = getMpConfigStatus();
    return NextResponse.json({
      mpConfig: mpStatus,
      events,
    });
  } catch (error) {
    return serverError('admin/webhooks GET', error);
  }
}
