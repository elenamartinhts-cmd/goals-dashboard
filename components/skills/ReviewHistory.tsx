'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SkillReview } from '@/lib/types';
import { SKILL_KEYS, SKILL_LABELS } from '@/lib/types';
import { Edit2 } from 'lucide-react';

const CHART_COLORS = ['#7B2D3E', '#C44B3D', '#D4A853', '#4A9B6F', '#7B5A8A'];

interface Props { reviews: SkillReview[]; onEdit: (r: SkillReview) => void; }

export default function ReviewHistory({ reviews, onEdit }: Props) {
  if (!reviews.length) {
    return <p className="text-sm text-center py-8" style={{ color: 'var(--hot-muted)' }}>No reviews yet.</p>;
  }

  const chartData = [...reviews].reverse().map(r => ({
    date: r.date.slice(5),
    ...Object.fromEntries(SKILL_KEYS.map(k => [k, r[k]])),
  }));

  return (
    <div className="space-y-3 pt-2 pb-4">

      {chartData.length > 1 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--hot-muted)' }}>
            Skills over time
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hot-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9E7882' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9E7882' }} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip
                formatter={(v: unknown, name: string) => [`${v ?? '—'}`, SKILL_LABELS[name as keyof typeof SKILL_LABELS] ?? name] as [string, string]}
                contentStyle={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', borderRadius: 8, fontSize: 11 }}
              />
              {SKILL_KEYS.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} strokeWidth={2}
                      dot={{ fill: CHART_COLORS[i], r: 3 }} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {SKILL_KEYS.map((k, i) => (
              <span key={k} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--hot-muted)' }}>
                <span className="w-3 h-0.5 inline-block rounded-full" style={{ background: CHART_COLORS[i] }}></span>
                {SKILL_LABELS[k]}
              </span>
            ))}
          </div>
        </div>
      )}

      {reviews.map(r => (
        <div key={r.id} className="rounded-2xl p-4"
             style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--hot-text)' }}>{r.focus_skill}</p>
              <p className="text-xs" style={{ color: 'var(--hot-muted)' }}>{r.date} · {r.calls_reviewed} call{r.calls_reviewed !== 1 ? 's' : ''} reviewed</p>
            </div>
            <button onClick={() => onEdit(r)} className="p-2 rounded-lg flex-shrink-0"
                    style={{ background: 'var(--hot-primary-light)' }}>
              <Edit2 size={14} style={{ color: 'var(--hot-primary)' }} />
            </button>
          </div>

          {r.drill && (
            <div className="rounded-xl p-3 mb-2" style={{ background: 'var(--hot-primary-light)' }}>
              <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--hot-primary-dark)' }}>DRILL</p>
              <p className="text-xs" style={{ color: 'var(--hot-text)' }}>{r.drill}</p>
            </div>
          )}

          {r.win && (
            <p className="text-xs" style={{ color: 'var(--hot-text-2)' }}>
              <span className="font-medium" style={{ color: 'var(--hot-success)' }}>Win: </span>{r.win}
            </p>
          )}

          {r.todos.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--hot-border)' }}>
              <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--hot-muted)' }}>To-dos</p>
              <ul className="space-y-0.5">
                {r.todos.map((t, i) => (
                  <li key={i} className="text-xs" style={{ color: 'var(--hot-text-2)' }}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
