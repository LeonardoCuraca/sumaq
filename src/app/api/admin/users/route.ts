import { NextResponse } from 'next/server';
import { getAllUserLogins } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { serverError } from '@/lib/api';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllUserLogins());
  } catch (error) {
    return serverError('admin/users GET', error);
  }
}
