'use client';

import { useState } from 'react';
import type { WeekData, HabitWeekData } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

interface Props {
  sheetData: { weeks: WeekData[] } | null;
  fetchedAt: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitsScreen({ sheetData: initial, fetchedAt: initialFetch }: Props) {
  const [sheetData, setSheetData] = useState(initial);
  const [fetchedAt, setFetchedAt] = useState(initialFetch);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    const res = await fetch('/api/sheets?refresh=1');
    if (res.ok) {
      const data = await res.json();
      setSheetData(data);
      setFetchedAt(new Date().toISOString());
    }
    setRefreshing(false);
  }

  const weeks: WeekData[] = sheetData?.weeks ?? [];
  // Use only past/current weeks
  const today = new Date().toISOString().slice(0, 10);
  const relevantWeeks = weeks.filter(w => w.start_date <= today).slice(-8);
  const latestWeek = relevantWeeks.at(-1) ?? null;

  // Build trend data per habit
  const allHabitNames = latestWeek?.habits.habit_names ?? [];

  const trendData = relevantWeeks.map(w => {
    const row: Record<string, any> = { week: w.start_date.slice(5) };
    w.habits.habit_names.forEach((name, i) => {
      row[name] = w.habits.weekly_pct[i];
    });
    return row;
  });

  // Doing well / needs attention (latest week)
  const doingWell: string[] = [];
  const needsAttention: string[] = [];

  if (latestWeek) {
    const lh = latestWeek.habits;
    lh.habit_names.forEach((name, i) => {
      const pct = lh.weekly_pct[i];
      if (pct === null) return;
      const days = lh.days[i]?.filter(Boolean).length ?? 0;
      const total = lh.days[i]?.length ?? 7;
      const label = `${name}: ${days}/${total} days (${Math.round(pct)}%)`;

      // Check previous week trend
      const prev = relevantWeeks.at(-2)?.habits;
      const prevIdx = prev?.habit_names.indexOf(name) ?? -1;
      const prevPct = prevIdx >= 0 ? (prev?.weekly_pct[prevIdx] ?? null) : null;

      if (pct >= 80) doingWell.push(label);
      else if (pct < 50) needsAttention.push(label);
    });
  }

  const COLORS = ['#C97B5B', '#D4A853', '#4A9B6F', '#7B8ACF', '#C97BAD', '#6BB5C9', '#C99B5B', '#8AC97B'];

  if (!sheetData || !weeks.length) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--hot-bg)' }}>
        <div className="px-5 pt-5 pb-3 safe-top">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>Habits</h1>
            <button onClick={handleRefresh} disabled={refreshing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', color: 'var(--hot-text-2)' }}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh sheet
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--hot-muted)' }}>
              Sheet not connected yet.
            </p>
            <p className="text-xs" style={{ color: 'var(--hot-muted)' }}>
              Go to Settings → connect Google Sheets, then refresh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--hot-bg)' }}>
      <div className="px-5 pt-5 pb-3 safe-top">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>Habits</h1>
          <button onClick={handleRefresh} disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', color: 'var(--hot-text-2)' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {fetchedAt && (
          <p className="text-[11px]" style={{ color: 'var(--hot-muted)' }}>
            Last updated {new Date(fetchedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">

        {/* Doing well / needs attention */}
        {(doingWell.length > 0 || needsAttention.length > 0) && (
          <div className="grid grid-cols-1 gap-3">
            {doingWell.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
                <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--hot-success)' }}>
                  Doing well
                </p>
                <ul className="space-y-1">
                  {doingWell.map((t, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--hot-text)' }}>✓ {t}</li>
                  ))}
                </ul>
              </div>
            )}
            {needsAttention.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
                <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--hot-warning)' }}>
                  Needs attention
                </p>
                <ul className="space-y-1">
                  {needsAttention.map((t, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--hot-text)' }}>→ {t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Latest week heatmap */}
        {latestWeek && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>
              This week
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '340px' }}>
                <thead>
                  <tr>
                    <th className="text-left pb-2 pr-2 font-normal" style={{ color: 'var(--hot-muted)', width: '120px' }}>Habit</th>
                    {DAY_LABELS.map(d => (
                      <th key={d} className="text-center pb-2 font-normal" style={{ color: 'var(--hot-muted)', width: '32px' }}>{d}</th>
                    ))}
                    <th className="text-right pb-2 font-medium" style={{ color: 'var(--hot-muted)', width: '40px' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {latestWeek.habits.habit_names.map((name, hi) => (
                    <tr key={name}>
                      <td className="pr-2 py-1 truncate max-w-[120px]" style={{ color: 'var(--hot-text)' }}>{name}</td>
                      {latestWeek.habits.days[hi]?.map((done, di) => (
                        <td key={di} className="text-center py-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs"
                                style={{
                                  background: done ? 'var(--hot-primary)' : 'var(--hot-primary-light)',
                                  color: done ? '#fff' : 'var(--hot-muted)',
                                }}>
                            {done ? '✓' : '·'}
                          </span>
                        </td>
                      ))}
                      <td className="text-right py-1 font-medium" style={{ color: 'var(--hot-text)' }}>
                        {latestWeek.habits.weekly_pct[hi] !== null
                          ? `${Math.round(latestWeek.habits.weekly_pct[hi]!)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trend chart */}
        {trendData.length > 1 && allHabitNames.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--hot-muted)' }}>
              Weekly completion %
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ left: -20, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hot-border)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9E8878' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9E8878' }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${Math.round(v)}%`}
                         contentStyle={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', borderRadius: 8, fontSize: 11 }} />
                {allHabitNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]}
                        strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}


      </div>
    </div>
  );
}
