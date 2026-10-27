'use client';

import { useState } from 'react';

interface Props {
  today: string;
  onSaved: () => void;
}

function Stepper({ label, value, onChange, max }: {
  label: string; value: number; onChange: (n: number) => void; max?: number;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--hot-bg)', border: '1px solid var(--hot-border)' }}>
      <p className="text-[11px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--hot-muted)' }}>{label}</p>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--hot-surface)', color: 'var(--hot-primary)', border: '1px solid var(--hot-border)' }}>
          −
        </button>
        <span className="flex-1 text-center text-3xl font-bold font-display" style={{ color: 'var(--hot-text)' }}>
          {value}
        </span>
        <button type="button"
          onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
          className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--hot-primary)', color: '#fff' }}>
          +
        </button>
      </div>
    </div>
  );
}

export default function BulkDayForm({ today, onSaved }: Props) {
  const [date, setDate]           = useState(today);
  const [callsTaken, setCallsTaken] = useState(0);
  const [noShows, setNoShows]     = useState(0);
  const [closes, setCloses]       = useState(0);
  const [commission, setCommission] = useState('');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const showed = Math.max(0, callsTaken - noShows);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (closes > showed) {
      setError(`Closes (${closes}) can't exceed calls that showed (${showed})`);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/calls/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          calls_taken: callsTaken,
          no_shows: noShows,
          closes,
          commission: commission ? parseFloat(commission) : 0,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
      setSaving(false);
    }
  }

  const inputStyle = {
    background: 'var(--hot-surface)',
    borderColor: 'var(--hot-border)',
    color: 'var(--hot-text)',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
               className="w-full h-12 px-4 rounded-xl border text-base outline-none"
               style={inputStyle} />
      </div>

      {/* Steppers */}
      <Stepper label="Calls taken" value={callsTaken} onChange={setCallsTaken} />
      <Stepper label="No-shows" value={noShows} onChange={v => setNoShows(Math.min(v, callsTaken))} max={callsTaken} />
      <Stepper label="Closes" value={closes} onChange={v => setCloses(Math.min(v, showed))} max={showed} />

      {/* Summary line */}
      <p className="text-[12px] text-center" style={{ color: 'var(--hot-muted)' }}>
        {showed} showed · {closes} closed · {showed - closes} follow-ups · {noShows} no-show
      </p>

      {/* Commission (only if closes > 0) */}
      {closes > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>
            Commission earned today ($) <span style={{ color: 'var(--hot-muted)' }}>— optional</span>
          </label>
          <input type="number" value={commission} onChange={e => setCommission(e.target.value)}
                 min="0" step="1" placeholder="e.g. 1900"
                 className="w-full h-12 px-4 rounded-xl border text-base outline-none"
                 style={inputStyle} />
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>
          Note <span style={{ color: 'var(--hot-muted)' }}>— optional</span>
        </label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
               placeholder="Anything worth remembering today"
               className="w-full h-12 px-4 rounded-xl border text-base outline-none"
               style={inputStyle} />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--hot-danger, #C0392B)' }}>{error}</p>}

      <button type="submit" disabled={saving || callsTaken === 0}
              className="w-full h-12 rounded-xl font-medium text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'var(--hot-primary)', color: '#fff' }}>
        {saving ? 'Saving…' : 'Save today\'s calls'}
      </button>
    </form>
  );
}
