import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { date, calls_taken, no_shows, closes, commission, note } = await req.json();

  if (!date || calls_taken == null) {
    return NextResponse.json({ error: 'date and calls_taken required' }, { status: 400 });
  }

  const showed = Math.max(0, calls_taken - no_shows);
  const followUps = Math.max(0, showed - closes);
  const commissionPerClose = closes > 0 && commission > 0 ? commission / closes : null;

  const rows = [
    ...Array.from({ length: no_shows }, () => ({
      date, showed: false, outcome: null, offer_id: null, commission: null,
      note: note || null,
    })),
    ...Array.from({ length: closes }, () => ({
      date, showed: true, outcome: 'closed', offer_id: null,
      commission: commissionPerClose,
      note: note || null,
    })),
    ...Array.from({ length: followUps }, () => ({
      date, showed: true, outcome: 'follow_up', offer_id: null, commission: null,
      note: null,
    })),
  ];

  const db = adminClient();

  // Delete existing calls for this date, then insert fresh
  const { error: delErr } = await db.from('calls').delete().eq('date', date);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (rows.length === 0) return NextResponse.json({ replaced: 0 });

  const { error: insErr } = await db.from('calls').insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ replaced: rows.length });
}
