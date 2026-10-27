'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Call, AppSettings } from '@/lib/types';
import { toMonthKey } from '@/lib/utils';
import { eachDayOfInterval, parseISO, format, startOfMonth, endOfMonth } from 'date-fns';

interface Props { calls: Call[]; settings: AppSettings; today: string; }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
      <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--hot-muted)' }}>{title}</p>
      {children}
    </div>
  );
}

export default function CallsCharts({ calls, settings, today }: Props) {
  const currentMonth = today.slice(0, 7);

  // 1. Daily calls taken vs no-shows (last 14 days)
  const dailyData = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 13);
    return eachDayOfInterval({ start, end: parseISO(today) }).map(d => {
      const ds = format(d, 'yyyy-MM-dd');
      const dayCalls = calls.filter(c => c.date === ds);
      return {
        date: format(d, 'dd/MM'),
        taken: dayCalls.filter(c => c.showed).length,
        noshow: dayCalls.filter(c => !c.showed).length,
      };
    });
  }, [calls, today]);

  // 2. Close % by week (last 8 weeks)
  const weeklyClose = useMemo(() => {
    const weeks: Record<string, { taken: number; closes: number }> = {};
    for (const c of calls) {
      const d = parseISO(c.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
      const key = format(monday, 'dd/MM');
      if (!weeks[key]) weeks[key] = { taken: 0, closes: 0 };
      if (c.showed) weeks[key].taken++;
      if (c.outcome === 'closed') weeks[key].closes++;
    }
    return Object.entries(weeks)
      .map(([week, { taken, closes }]) => ({
        week,
        pct: taken > 0 ? Math.round((closes / taken) * 100) : 0,
      }))
      .slice(-8);
  }, [calls]);

  // 3. Commission cumulative vs target
  const cumData = useMemo(() => {
    const monthCalls = calls.filter(c => toMonthKey(c.date) === currentMonth && c.outcome === 'closed');
    const days = eachDayOfInterval({
      start: startOfMonth(parseISO(currentMonth + '-01')),
      end:   endOfMonth(parseISO(currentMonth + '-01')),
    });
    const total = settings.income_goal;
    const totalDays = days.length;
    let cum = 0;
    return days.map((d, i) => {
      const ds = format(d, 'yyyy-MM-dd');
      const dayCom = monthCalls
        .filter(c => c.date === ds)
        .reduce((s, c) => s + (c.commission ?? 0), 0);
      cum += dayCom;
      return {
        day: format(d, 'd'),
        earned: ds <= today ? cum : null,
        target: Math.round((total / totalDays) * (i + 1)),
      };
    });
  }, [calls, currentMonth, settings.income_goal, today]);

  const PINK   = '#C97B5B';
  const GOLD   = '#D4A853';
  const MUTED  = '#9E8878';
  const SUCCESS = '#4A9B6F';

  if (!calls.length) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--hot-muted)' }}>
        Log some calls to see charts.
      </p>
    );
  }

  return (
    <div className="space-y-5 pt-2 pb-4">

      <ChartCard title="Daily calls — last 14 days">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData} margin={{ left: -20, right: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hot-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} />
            <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="taken"  name="Taken"    fill={PINK}  radius={[4,4,0,0]} />
            <Bar dataKey="noshow" name="No-show"  fill={MUTED} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Close % by week">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyClose} margin={{ left: -20, right: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hot-border)" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: MUTED }} />
            <YAxis tick={{ fontSize: 10, fill: MUTED }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(v: number) => `${v}%`}
                     contentStyle={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="pct" name="Close %" stroke={PINK} strokeWidth={2} dot={{ fill: PINK, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Commission — ${new Date(currentMonth + '-01').toLocaleDateString('en-GB', { month: 'long' })}`}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={cumData} margin={{ left: -5, right: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hot-border)" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: MUTED }} />
            <YAxis tick={{ fontSize: 10, fill: MUTED }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`}
                     contentStyle={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="target" name="Target"  stroke={GOLD}    strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="earned" name="Earned"  stroke={SUCCESS} strokeWidth={2.5} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--hot-muted)' }}>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ background: SUCCESS }}></span>Earned</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ borderTop: `1.5px dashed ${GOLD}` }}></span>Target</span>
        </div>
      </ChartCard>

    </div>
  );
}
