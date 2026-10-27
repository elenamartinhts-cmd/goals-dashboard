import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { fetchCommissionData } from '@/lib/commission-sheet';

const CACHE_MINUTES = 30;

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1';
  const db = adminClient();

  // Try cache first
  if (!forceRefresh) {
    const { data: cached } = await db
      .from('sheet_cache')
      .select('fetched_at, data')
      .eq('id', 'commission')
      .single();

    if (cached) {
      const age = (Date.now() - new Date(cached.fetched_at).getTime()) / 60000;
      if (age < CACHE_MINUTES) {
        return NextResponse.json({ ...cached.data, cached: true });
      }
    }
  }

  try {
    const entries = await fetchCommissionData();
    const payload = { entries, fetched_at: new Date().toISOString() };

    await db.from('sheet_cache').upsert({ id: 'commission', fetched_at: payload.fetched_at, data: payload });

    return NextResponse.json(payload);
  } catch (err) {
    // Return stale cache on error
    const { data: stale } = await db.from('sheet_cache').select('data').eq('id', 'commission').single();
    if (stale?.data) return NextResponse.json({ ...stale.data, stale: true });
    return NextResponse.json({ entries: [], error: String(err) }, { status: 500 });
  }
}
