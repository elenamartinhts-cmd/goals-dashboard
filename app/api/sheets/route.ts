import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { fetchSheetData } from '@/lib/sheets';

const CACHE_MINUTES = 30;

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1';
  const db = adminClient();

  if (!forceRefresh) {
    const { data: cached } = await db
      .from('sheet_cache')
      .select('fetched_at, data')
      .eq('id', 'singleton')
      .single();

    if (cached) {
      const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
      if (ageMs < CACHE_MINUTES * 60 * 1000) {
        return NextResponse.json({ ...cached.data, cached: true });
      }
    }
  }

  try {
    const sheetData = await fetchSheetData();
    await db
      .from('sheet_cache')
      .upsert({ id: 'singleton', fetched_at: new Date().toISOString(), data: sheetData });
    return NextResponse.json(sheetData);
  } catch (err: any) {
    // Return stale cache on error if available
    const { data: stale } = await db.from('sheet_cache').select('data').eq('id', 'singleton').single();
    if (stale) return NextResponse.json({ ...stale.data, stale: true });
    return NextResponse.json({ error: err.message, weeks: [] }, { status: 500 });
  }
}
