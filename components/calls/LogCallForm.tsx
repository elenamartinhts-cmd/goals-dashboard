'use client';

import { useState } from 'react';
import type { Call, AppSettings, CallOutcome } from '@/lib/types';

interface Props {
  settings: AppSettings;
  today: string;
  initialData: Call | null;
  onSaved: () => void;
}

export default function LogCallForm({ settings, today, initialData, onSaved }: Props) {
  const [date,       setDate]       = useState(initialData?.date ?? today);
  const [showed,     setShowed]     = useState(initialData ? initialData.showed : true);
  const [outcome,    setOutcome]    = useState<CallOutcome | ''>(initialData?.outcome ?? '');
  const [offerId,    setOfferId]    = useState(initialData?.offer_id ?? '');
  const [commission, setCommission] = useState(initialData?.commission?.toString() ?? '');
  const [note,       setNote]       = useState(initialData?.note ?? '');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const selectedOffer = settings.offers.find(o => o.id === offerId);

  function onOfferChange(id: string) {
    setOfferId(id);
    const offer = settings.offers.find(o => o.id === id);
    if (offer) setCommission(String(offer.commission));
  }

  const needsOffer = outcome === 'closed' || outcome === 'deposit';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      date,
      showed,
      outcome: showed ? (outcome || null) : null,
      offer_id: needsOffer ? offerId || null : null,
      commission: needsOffer && commission ? parseFloat(commission) : null,
      note: note.trim() || null,
    };

    try {
      const url  = initialData ? `/api/calls/${initialData.id}` : '/api/calls';
      const method = initialData ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      {/* Showed / No-show */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--hot-text-2)' }}>Showed up?</label>
        <div className="flex gap-2">
          {([true, false] as const).map(val => (
            <button key={String(val)} type="button"
                    onClick={() => setShowed(val)}
                    className="flex-1 h-12 rounded-xl border text-sm font-medium transition-all"
                    style={{
                      background: showed === val ? 'var(--hot-primary)' : 'var(--hot-surface)',
                      borderColor: showed === val ? 'var(--hot-primary)' : 'var(--hot-border)',
                      color: showed === val ? '#fff' : 'var(--hot-text-2)',
                    }}>
              {val ? 'Showed' : 'No-show'}
            </button>
          ))}
        </div>
      </div>

      {/* Outcome (only if showed) */}
      {showed && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--hot-text-2)' }}>Outcome</label>
          <div className="grid grid-cols-2 gap-2">
            {(['closed', 'deposit', 'follow_up', 'lost'] as CallOutcome[]).map(o => (
              <button key={o} type="button"
                      onClick={() => setOutcome(o)}
                      className="h-11 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        background: outcome === o ? 'var(--hot-primary)' : 'var(--hot-surface)',
                        borderColor: outcome === o ? 'var(--hot-primary)' : 'var(--hot-border)',
                        color: outcome === o ? '#fff' : 'var(--hot-text-2)',
                      }}>
                {{ closed: 'Closed', deposit: 'Deposit', follow_up: 'Follow-up', lost: 'Lost' }[o]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offer + commission (only for closed/deposit) */}
      {showed && needsOffer && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>Offer</label>
            <select value={offerId} onChange={e => onOfferChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border text-base outline-none"
                    style={inputStyle}>
              <option value="">Select offer…</option>
              {settings.offers.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>Commission ($)</label>
            <input type="number" value={commission} onChange={e => setCommission(e.target.value)}
                   min="0" step="1" placeholder="Auto-filled from offer"
                   className="w-full h-12 px-4 rounded-xl border text-base outline-none"
                   style={inputStyle} />
          </div>
        </>
      )}

      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>Note (optional)</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
               placeholder="One line…"
               className="w-full h-12 px-4 rounded-xl border text-base outline-none"
               style={inputStyle} />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--hot-danger)' }}>{error}</p>}

      <button type="submit" disabled={saving}
              className="w-full h-12 rounded-xl font-medium text-base transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--hot-primary)', color: '#fff' }}>
        {saving ? 'Saving…' : initialData ? 'Save changes' : 'Log call'}
      </button>
    </form>
  );
}
