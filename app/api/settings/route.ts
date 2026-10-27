import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/types';

export async function GET() {
  const db = adminClient();
  const { data, error } = await db.from('settings').select('data').eq('id', 'singleton').single();
  if (error || !data) return NextResponse.json(DEFAULT_SETTINGS);
  return NextResponse.json({ ...DEFAULT_SETTINGS, ...data.data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = adminClient();
  const { data, error } = await db
    .from('settings')
    .upsert({ id: 'singleton', data: body })
    .select('data')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.data);
}
