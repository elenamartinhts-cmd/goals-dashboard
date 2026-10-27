'use client';

import { formatUSD, formatPct } from '@/lib/utils';
import type { AppSettings, MonthMetrics } from '@/lib/types';
import PaceBadge from './PaceBadge';

interface Props {
  today: string;
  settings: AppSettings;
  monthMetrics: MonthMetrics;
  todayMetrics: { calls_taken: number; no_shows: number; closes: number; commission_earned: number };
  latestReview: any;
  todaySheetDay: any | null;
}

export default function NightView({ monthMetrics: m, todayMetrics: t, todaySheetDay }: Props) {
  const todayHabits: Array<{ name: string; done: boolean }> = [];
  if (todaySheetDay) {
    // todaySheetDay has day_of_week; match against week habit data passed from parent
    // For now show task summary
  }

  const noShowPct  = m.no_show_pct;
  const closePct   = m.close_pct;

  return (
    <div className="space-y-5 pt-2 pb-6">

      {/* 1. Today's numbers */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>
          Today
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calls taken',  value: t.calls_taken },
            { label: 'No-shows',     value: t.no_shows },
            { label: 'Closes',       value: t.closes },
            { label: 'Commission',   value: formatUSD(t.commission_earned) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4"
                 style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--hot-muted)' }}>{label}</p>
              <p className="text-2xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Month progress */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--hot-muted)' }}>
            Month progress
          </p>
          <PaceBadge badge={m.pace_badge} />
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm font-medium mb-1">
            <span style={{ color: 'var(--hot-success)' }}>{formatUSD(m.commission_earned)}</span>
            <span style={{ color: 'var(--hot-muted)' }}>{formatUSD(m.income_goal)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--hot-primary-light)' }}>
            <div
              className="h-full rounded-full commission-bar transition-all duration-700"
              style={{ width: `${Math.min(100, (m.commission_earned / m.income_goal) * 100)}%` }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--hot-muted)' }}>
            {formatUSD(m.money_left)} to go
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid var(--hot-border)' }}>
          <div className="text-center">
            <p className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>
              {m.core_closes}<span className="text-sm font-normal" style={{ color: 'var(--hot-muted)' }}>/{m.core_target}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--hot-muted)' }}>Core closes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>{m.working_days_remaining}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--hot-muted)' }}>Days left</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold font-display" style={{ color: m.commission_pending > 0 ? 'var(--hot-warning)' : 'var(--hot-muted)' }}>
              {formatUSD(m.commission_pending)}
            </p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--hot-muted)' }}>Deposits</p>
          </div>
        </div>
      </div>

      {/* 3. Rates */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>
          Your rates
        </p>
        <div className="space-y-2">
          {[
            { label: 'Close rate — this month', value: formatPct(m.close_pct) },
            { label: 'No-show rate — this month', value: formatPct(m.no_show_pct) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2"
                 style={{ borderBottom: '1px solid var(--hot-border)' }}>
              <span className="text-sm" style={{ color: 'var(--hot-text-2)' }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--hot-text)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Pace estimate */}
        {m.calls_needed_estimate !== null && m.calls_needed_estimate > 0 && (
          <p className="mt-3 text-sm rounded-xl p-3" style={{ background: 'var(--hot-primary-light)', color: 'var(--hot-primary-dark)' }}>
            At your current close rate, you need about {m.calls_needed_estimate} more calls taken this month.
          </p>
        )}
        {m.calls_taken < 10 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--hot-muted)' }}>
            Pace estimate unlocks after 10 calls taken.
          </p>
        )}
      </div>

      {/* 4. Today's sheet data */}
      {todaySheetDay && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>
            Tasks today
          </p>
          <div className="flex gap-4 mb-2">
            <div>
              <span className="text-lg font-semibold" style={{ color: 'var(--hot-success)' }}>{todaySheetDay.completed_count}</span>
              <span className="text-xs ml-1" style={{ color: 'var(--hot-muted)' }}>completed</span>
            </div>
            <div>
              <span className="text-lg font-semibold" style={{ color: 'var(--hot-warning)' }}>{todaySheetDay.outstanding_count}</span>
              <span className="text-xs ml-1" style={{ color: 'var(--hot-muted)' }}>outstanding</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reminders */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--hot-primary-light)', border: '1px solid var(--hot-border)' }}>
        <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--hot-primary-dark)' }}>
          Before you close out
        </p>
        <ul className="space-y-1.5 text-sm" style={{ color: 'var(--hot-text)' }}>
          <li>• Log today's calls in the Calls tab</li>
          <li>• Upload today's recordings for review</li>
          <li>• Tick off today's habits in your planner</li>
        </ul>
      </div>

    </div>
  );
}
