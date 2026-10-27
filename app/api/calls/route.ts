import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export async function GET() {
  const db = adminClient();
  const { data, error } = await db
    .from('calls')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = adminClient();
  const { data, error } = await db.from('calls').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
