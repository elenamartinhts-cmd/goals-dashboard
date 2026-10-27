'use client';

import { useState } from 'react';
import type { AppSettings, Offer, WorkDay } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, LogOut, RefreshCw } from 'lucide-react';

const MOTTOS = [
  '$10K months. Act like it.',
  'Close like a $10K closer today.',
  'She does $10K months. Be her today.',
];

const ALL_DAYS: WorkDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL: Record<WorkDay, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export default function SettingsScreen({ initial }: { initial: AppSettings }) {
  const [s, setS] = useState<AppSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newOffer, setNewOffer] = useState({ name: '', price: '', commission: '', is_core: false });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message ?? 'Error saving');
    } finally {
      setSaving(false);
    }
  }

  function addOffer() {
    if (!newOffer.name.trim() || !newOffer.price) return;
    const offer: Offer = {
      id: Date.now().toString(),
      name: newOffer.name.trim(),
      price: parseFloat(newOffer.price),
      commission: parseFloat(newOffer.commission) || 0,
      is_core: newOffer.is_core,
    };
    setS(prev => ({ ...prev, offers: [...prev.offers, offer] }));
    setNewOffer({ name: '', price: '', commission: '', is_core: false });
  }

  function removeOffer(id: string) {
    setS(prev => ({ ...prev, offers: prev.offers.filter(o => o.id !== id) }));
  }

  function toggleDay(day: WorkDay) {
    setS(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day],
    }));
  }

  async function handleRefreshSheet() {
    setRefreshing(true);
    await fetch('/api/sheets?refresh=1');
    setRefreshing(false);
    router.refresh();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function handleExportCSV() {
    const res = await fetch('/api/calls');
    const calls = await res.json();
    const rows = [
      ['Date', 'Showed', 'Outcome', 'Offer', 'Commission', 'Note'],
      ...calls.map((c: any) => [c.date, c.showed ? 'yes' : 'no', c.outcome ?? '', c.offer_id ?? '', c.commission ?? '', c.note ?? '']),
    ];
    const csv = rows.map(r => r.map(String).map((v: string) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calls-export.csv';
    a.click();
  }

  const inputStyle = {
    background: 'var(--hot-surface)',
    borderColor: 'var(--hot-border)',
    color: 'var(--hot-text)',
  };

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>{title}</p>
        {children}
      </div>
    );
  }

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--hot-text-2)' }}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--hot-bg)' }}>
      <div className="px-5 pt-5 pb-3 safe-top">
        <h1 className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">

        {/* Targets */}
        <Section title="Targets">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Income goal ($)">
              <input type="number" value={s.income_goal}
                     onChange={e => setS(p => ({ ...p, income_goal: Number(e.target.value) }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Core closes target">
              <input type="number" value={s.core_closes_target}
                     onChange={e => setS(p => ({ ...p, core_closes_target: Number(e.target.value) }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* Offers */}
        <Section title="Offers">
          <div className="space-y-2 mb-3">
            {s.offers.map(o => (
              <div key={o.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                   style={{ background: 'var(--hot-bg)', border: '1px solid var(--hot-border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--hot-text)' }}>{o.name}</p>
                  <p className="text-xs" style={{ color: 'var(--hot-muted)' }}>
                    ${o.price.toLocaleString()} · commission ${o.commission.toLocaleString()}
                    {o.is_core && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded"
                                        style={{ background: 'var(--hot-primary-light)', color: 'var(--hot-primary)' }}>core</span>}
                  </p>
                </div>
                <button onClick={() => removeOffer(o.id)} className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ background: '#FDDDD9' }}>
                  <Trash2 size={12} style={{ color: 'var(--hot-danger)' }} />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs font-medium mb-2" style={{ color: 'var(--hot-text-2)' }}>Add offer</p>
          <div className="space-y-2">
            <input value={newOffer.name} onChange={e => setNewOffer(p => ({ ...p, name: e.target.value }))}
                   placeholder="Name (e.g. VIP Day — $5,000)"
                   className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={newOffer.price} onChange={e => setNewOffer(p => ({ ...p, price: e.target.value }))}
                     placeholder="Price ($)" className="h-10 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
              <input type="number" value={newOffer.commission} onChange={e => setNewOffer(p => ({ ...p, commission: e.target.value }))}
                     placeholder="Commission ($)" className="h-10 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--hot-text-2)' }}>
              <input type="checkbox" checked={newOffer.is_core}
                     onChange={e => setNewOffer(p => ({ ...p, is_core: e.target.checked }))}
                     className="w-4 h-4" />
              Counts toward seat requirement
            </label>
            <button onClick={addOffer} disabled={!newOffer.name.trim() || !newOffer.price}
                    className="w-full h-10 rounded-xl text-sm font-medium disabled:opacity-40"
                    style={{ background: 'var(--hot-primary-light)', color: 'var(--hot-primary-dark)', border: '1px solid var(--hot-border)' }}>
              + Add offer
            </button>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <Field label="Working days">
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: s.working_days.includes(d) ? 'var(--hot-primary)' : 'var(--hot-surface)',
                          color: s.working_days.includes(d) ? '#fff' : 'var(--hot-text-2)',
                          border: '1px solid var(--hot-border)',
                        }}>
                  {DAY_LABEL[d]}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shift start">
              <input type="time" value={s.shift_start}
                     onChange={e => setS(p => ({ ...p, shift_start: e.target.value }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Shift end">
              <input type="time" value={s.shift_end}
                     onChange={e => setS(p => ({ ...p, shift_end: e.target.value }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Expected calls/day">
              <input type="number" value={s.expected_calls_per_day}
                     onChange={e => setS(p => ({ ...p, expected_calls_per_day: Number(e.target.value) }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* Display */}
        <Section title="Display">
          <Field label="Motto">
            <div className="space-y-2">
              {MOTTOS.map(m => (
                <button key={m} type="button" onClick={() => setS(p => ({ ...p, motto: m }))}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          background: s.motto === m ? 'var(--hot-primary-light)' : 'var(--hot-bg)',
                          border: `1px solid ${s.motto === m ? 'var(--hot-primary)' : 'var(--hot-border)'}`,
                          color: 'var(--hot-text)',
                        }}>
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morning view from">
              <input type="time" value={s.morning_start}
                     onChange={e => setS(p => ({ ...p, morning_start: e.target.value }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Night view from">
              <input type="time" value={s.night_start}
                     onChange={e => setS(p => ({ ...p, night_start: e.target.value }))}
                     className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* Sheet */}
        <Section title="Google Sheet">
          <p className="text-xs mb-3" style={{ color: 'var(--hot-text-2)' }}>
            Refreshes automatically on page load (cached 30 min).
          </p>
          <button onClick={handleRefreshSheet} disabled={refreshing}
                  className="flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium w-full justify-center"
                  style={{ background: 'var(--hot-bg)', border: '1px solid var(--hot-border)', color: 'var(--hot-text-2)' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Force refresh now'}
          </button>
        </Section>

        {/* Save */}
        {error && <p className="text-sm text-center" style={{ color: 'var(--hot-danger)' }}>{error}</p>}
        <button onClick={handleSave} disabled={saving}
                className="w-full h-12 rounded-xl font-medium text-base transition-all active:scale-95 disabled:opacity-50"
                style={{ background: saved ? 'var(--hot-success)' : 'var(--hot-primary)', color: '#fff' }}>
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save settings'}
        </button>

        {/* Export & logout */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExportCSV}
                  className="h-11 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', color: 'var(--hot-text-2)' }}>
            Export CSV
          </button>
          <button onClick={handleLogout}
                  className="h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: '#FDDDD9', color: 'var(--hot-danger)' }}>
            <LogOut size={14} /> Log out
          </button>
        </div>

      </div>
    </div>
  );
}
