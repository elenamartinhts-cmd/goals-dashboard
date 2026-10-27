'use client';

import { useState, useEffect } from 'react';
import { formatUSD } from '@/lib/utils';
import type { AppSettings, MonthMetrics, SkillReview } from '@/lib/types';
import PaceBadge from './PaceBadge';
import { AlertCircle } from 'lucide-react';

interface Props {
  today: string;
  settings: AppSettings;
  monthMetrics: MonthMetrics;
  prevMonthMetrics: MonthMetrics;
  latestReview: SkillReview | null;
  dataTodos: string[];
  todaySheetDay: any | null;
  yesterdayMetrics: { calls_taken: number; no_shows: number; closes: number; commission_earned: number };
  trackerCommissionThisMonth: number | null;
  trackerCommissionPrevMonth: number | null;
  trackerEntries: any[];
}

// Jan 1 2027 00:00 Europe/Madrid = Dec 31 2026 23:00 UTC
const TARGET_MS = new Date('2026-12-31T23:00:00Z').getTime();

function Countdown() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    setSecs(Math.max(0, Math.floor((TARGET_MS - Date.now()) / 1000)));
    const id = setInterval(() => setSecs(Math.max(0, Math.floor((TARGET_MS - Date.now()) / 1000))), 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <div className="flex gap-2" suppressHydrationWarning>
      {[{ v: d, l: 'days' }, { v: h, l: 'hrs' }, { v: m, l: 'min' }, { v: s, l: 'sec' }].map(({ v, l }) => (
        <div key={l} className="flex-1 rounded-xl py-3 text-center" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          <div className="text-2xl font-bold font-display" style={{ color: 'var(--hot-primary)' }} suppressHydrationWarning>
            {String(v).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--hot-muted)' }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>{label}</p>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--hot-bg)' }}>
      <p className="text-[10px] mb-1" style={{ color: 'var(--hot-muted)' }}>{label}</p>
      <p className="text-xl font-bold font-display" style={{ color: 'var(--hot-text)' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--hot-primary)' }}>{sub}</p>}
    </div>
  );
}

function buildAnalysis(m: MonthMetrics, prevM: MonthMetrics): string[] {
  const lines: string[] = [];
  const closesLeft = Math.max(0, m.core_target - m.core_closes);
  const daysLeft = m.working_days_remaining;

  if (closesLeft === 0) {
    lines.push(`You hit your ${m.core_target} closes — now push for extra commission.`);
  } else {
    lines.push(`You need ${closesLeft} more close${closesLeft > 1 ? 's' : ''} in ${daysLeft} working day${daysLeft !== 1 ? 's' : ''} — that's 1 every ${daysLeft > 0 ? Math.ceil(daysLeft / closesLeft) : '?'} days.`);
  }

  if (m.close_pct !== null && m.close_pct > 0) {
    const callsNeeded = m.calls_needed_estimate;
    if (callsNeeded !== null && callsNeeded > 0) {
      lines.push(`At your ${Math.round(m.close_pct)}% close rate, you need ~${callsNeeded} more calls taken this month.`);
    }
  } else if (m.calls_taken < 10) {
    lines.push(`Log at least 10 calls to unlock your personal close rate estimate.`);
  }

  if (m.no_show_pct !== null && m.no_show_pct > 25) {
    lines.push(`No-show rate is ${Math.round(m.no_show_pct)}% — send confirmations the night before every call.`);
  }

  if (prevM.commission_earned > 0 && m.commission_earned === 0 && m.working_days_elapsed > 3) {
    lines.push(`Last month you earned ${formatUSD(prevM.commission_earned)}. Volume first — get calls on the board.`);
  }

  if (lines.length < 3) {
    lines.push(`Biggest lever right now: booked calls. Pitch optimization comes after volume.`);
  }

  return lines.slice(0, 4);
}

export default function MorningView({
  settings, monthMetrics, prevMonthMetrics,
  latestReview, dataTodos, todaySheetDay, yesterdayMetrics,
  trackerCommissionThisMonth, trackerCommissionPrevMonth, trackerEntries,
}: Props) {
  const m = monthMetrics;
  const pm = prevMonthMetrics;

  // Prefer tracker commission (source of truth) over manual call log
  const earnedThisMonth = trackerCommissionThisMonth ?? m.commission_earned;
  const earnedPrevMonth = trackerCommissionPrevMonth ?? pm.commission_earned;
  const trackerCloses   = trackerEntries.filter(e => e.month === m.month).length;
  const prevTrackerCloses = trackerEntries.filter(e => e.month === pm.month).length;

  const analysis = buildAnalysis(m, pm);

  const reviewIsStale = latestReview
    ? latestReview.date < new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    : true;

  const allTodos: Array<{ text: string; badge?: string }> = [
    ...(latestReview?.todos ?? []).map(t => ({ text: t })),
    ...dataTodos.map(t => ({ text: t, badge: 'From numbers' })),
  ].slice(0, 5);

  const top3 = todaySheetDay?.top3_priorities ?? [];

  const progressPct = Math.min(100, m.income_goal > 0 ? (earnedThisMonth / m.income_goal) * 100 : 0);

  // On-pace projection based on tracker earnings
  const pacedCommission = m.working_days_total > 0 && m.working_days_elapsed > 0 && earnedThisMonth > 0
    ? Math.round((earnedThisMonth / m.working_days_elapsed) * m.working_days_total)
    : null;

  return (
    <div className="space-y-3 pt-2 pb-6">

      {/* Motto */}
      <div className="text-center py-4 px-2">
        <p className="font-display text-4xl font-bold leading-tight" style={{ color: 'var(--hot-primary)' }}>
          "{settings.motto}"
        </p>
      </div>

      {/* Countdown */}
      <div className="px-4">
        <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--hot-muted)' }}>
          Time left to hit $10K months
        </p>
        <Countdown />
      </div>

      {/* Progress */}
      <div className="mx-4">
        <Section label="Your progress">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatBox
              label={`${new Date(pm.month + '-15').toLocaleDateString('en-GB', { month: 'long' })} (last month)`}
              value={formatUSD(earnedPrevMonth)}
              sub={prevTrackerCloses > 0 ? `${prevTrackerCloses} closes` : `${pm.core_closes} closes`}
            />
            <StatBox
              label={`${new Date(m.month + '-15').toLocaleDateString('en-GB', { month: 'long' })} (this month)`}
              value={formatUSD(earnedThisMonth)}
              sub={pacedCommission !== null && m.working_days_elapsed > 0
                ? `On pace for ${formatUSD(pacedCommission)}`
                : `${trackerCloses > 0 ? trackerCloses : m.core_closes}/${m.core_target} closes`}
            />
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--hot-muted)' }}>
              <span>{formatUSD(earnedThisMonth)} earned{trackerCommissionThisMonth !== null ? ' · from tracker' : ''}</span>
              <div className="flex items-center gap-2">
                <PaceBadge badge={m.pace_badge} />
                <span>{formatUSD(Math.max(0, m.income_goal - earnedThisMonth))} to go</span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--hot-primary-light)' }}>
              <div className="h-full rounded-full commission-bar transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--hot-muted)' }}>
              {m.core_closes}/{m.core_target} core closes · goal {formatUSD(m.income_goal)}
            </p>
          </div>
        </Section>
      </div>

      {/* Focus skill + yesterday */}
      <div className="mx-4">
        <Section label={`Focus skill · yesterday's numbers`}>
          {latestReview ? (
            <>
              {reviewIsStale && (
                <div className="flex items-center gap-1 text-[11px] mb-2" style={{ color: 'var(--hot-warning, #C97B5B)' }}>
                  <AlertCircle size={12} />
                  <span>Review from {latestReview.date} — paste a fresh one after today's calls</span>
                </div>
              )}
              <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full mb-2"
                    style={{ background: 'var(--hot-primary-light)', color: 'var(--hot-primary)' }}>
                {latestReview.focus_skill}
              </span>
              {latestReview.why && (
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--hot-text-2)' }}>
                  {latestReview.why}
                </p>
              )}
              {latestReview.drill && (
                <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--hot-primary-light)' }}>
                  <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--hot-primary-dark)' }}>
                    Today's drill
                  </p>
                  <p className="text-xs leading-snug" style={{ color: 'var(--hot-text)' }}>
                    {latestReview.drill}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm mb-3" style={{ color: 'var(--hot-muted)' }}>
              No review yet — paste one in the Skills tab after calls.
            </p>
          )}
          {/* Yesterday grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Calls', value: yesterdayMetrics.calls_taken },
              { label: 'No-shows', value: yesterdayMetrics.no_shows },
              { label: 'Closed', value: yesterdayMetrics.closes },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-2 text-center" style={{ background: 'var(--hot-bg)' }}>
                <p className="text-xl font-bold font-display" style={{ color: 'var(--hot-text)' }}>{value}</p>
                <p className="text-[10px]" style={{ color: 'var(--hot-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Sales rates */}
      <div className="mx-4">
        <Section label="Your rates">
          <div className="grid grid-cols-2 gap-2">
            <StatBox
              label="Close rate · this month"
              value={m.close_pct !== null ? `${Math.round(m.close_pct)}%` : '—'}
              sub={m.calls_taken < 10 ? `(${m.calls_taken}/10 calls min)` : `${m.calls_taken} calls taken`}
            />
            <StatBox
              label="No-show rate · this month"
              value={m.no_show_pct !== null ? `${Math.round(m.no_show_pct)}%` : '—'}
              sub={m.no_show_pct !== null && m.no_show_pct > 25 ? '⚠ above 25%' : 'target <25%'}
            />
          </div>
          {m.calls_needed_estimate !== null && m.calls_needed_estimate > 0 && (
            <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--hot-muted)' }}>
              At your close rate → need ~{m.calls_needed_estimate} more calls taken to hit target
            </p>
          )}
        </Section>
      </div>

      {/* To-do today */}
      {(allTodos.length > 0 || top3.length > 0) && (
        <div className="mx-4">
          <Section label="To-do today">
            {[...top3.slice(0, 3).map((t: string) => ({ text: t, badge: 'Sheet' })), ...allTodos]
              .slice(0, 5)
              .map(({ text, badge }, i) => (
                <div key={i} className="flex items-start gap-3 py-2"
                     style={{ borderBottom: i < 4 ? '1px solid var(--hot-border)' : 'none' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: 'var(--hot-primary-light)', color: 'var(--hot-primary)' }}>
                    {i + 1}
                  </span>
                  <span className="text-sm flex-1 leading-snug" style={{ color: 'var(--hot-text)' }}>{text}</span>
                  {badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#FFF3DC', color: '#8A5200' }}>{badge}</span>
                  )}
                </div>
              ))}
          </Section>
        </div>
      )}

      {/* Analysis */}
      <div className="mx-4">
        <div className="rounded-2xl p-4" style={{ background: '#FDF8F2', border: '1px solid var(--hot-accent, #D4A853)30' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"
             style={{ color: 'var(--hot-accent, #D4A853)' }}>
            <span>✦</span> Analysis · what to prioritize
          </p>
          <ul className="space-y-2">
            {analysis.map((line, i) => (
              <li key={i} className="text-sm leading-snug pl-3 relative"
                  style={{ color: 'var(--hot-text-2)' }}>
                <span className="absolute left-0 top-1" style={{ color: 'var(--hot-primary)', fontSize: 10 }}>→</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
