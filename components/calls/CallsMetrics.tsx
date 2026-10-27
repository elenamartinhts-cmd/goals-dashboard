import type { Call, AppSettings, MonthMetrics } from '@/lib/types';
import { formatUSD, formatPct, toMonthKey } from '@/lib/utils';
import PaceBadge from '../today/PaceBadge';
import { computeMonthMetrics } from '@/lib/metrics';

interface Props {
  calls: Call[];
  settings: AppSettings;
  monthMetrics: MonthMetrics;
  today: string;
  onEdit: (c: Call) => void;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--hot-muted)' }}>{label}</p>
      <p className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--hot-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function CallsMetrics({ calls, settings, monthMetrics: m, today }: Props) {
  const currentMonth = today.slice(0, 7);
  const months = [...new Set(calls.map(c => toMonthKey(c.date)))].sort().reverse();

  // Per-month breakdown
  const monthData = months.map(mo => ({
    label: new Date(mo + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    metrics: computeMonthMetrics(calls, settings, mo),
  }));

  // Today
  const todayCalls = calls.filter(c => c.date === today);
  const todayTaken = todayCalls.filter(c => c.showed).length;
  const todayCloses = todayCalls.filter(c => c.outcome === 'closed').length;

  // This week (Mon–today)
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekCalls = calls.filter(c => c.date >= weekStartStr && c.date <= today);
  const weekTaken = weekCalls.filter(c => c.showed).length;
  const weekCloses = weekCalls.filter(c => c.outcome === 'closed').length;

  return (
    <div className="space-y-6 pt-2 pb-4">

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Today — calls" value={todayTaken} sub={`${todayCloses} close${todayCloses !== 1 ? 's' : ''}`} />
        <StatCard label="Week — calls" value={weekTaken} sub={`${weekCloses} close${weekCloses !== 1 ? 's' : ''}`} />
      </div>

      {/* Monthly metrics */}
      {monthData.map(({ label, metrics: mo }) => (
        <div key={mo.month} className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold" style={{ color: 'var(--hot-text)' }}>{label}</p>
            <PaceBadge badge={mo.pace_badge} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatCard label="Core closes" value={`${mo.core_closes} / ${mo.core_target}`} />
            <StatCard label="Commission" value={formatUSD(mo.commission_earned)}
                      sub={mo.commission_pending > 0 ? `${formatUSD(mo.commission_pending)} pending` : undefined} />
            <StatCard label="Close rate" value={formatPct(mo.close_pct)} sub={`${mo.closes} closes / ${mo.calls_taken} taken`} />
            <StatCard label="No-show rate" value={formatPct(mo.no_show_pct)} sub={`${mo.no_shows} / ${mo.calls_booked} booked`} />
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--hot-muted)' }}>
              <span>{formatUSD(mo.commission_earned)} of {formatUSD(mo.income_goal)}</span>
              <span>{mo.working_days_remaining}d left</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--hot-primary-light)' }}>
              <div className="h-full rounded-full commission-bar"
                   style={{ width: `${Math.min(100, (mo.commission_earned / mo.income_goal) * 100)}%` }} />
            </div>
          </div>

          {mo.follow_ups_pending > 0 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--hot-text-2)' }}>
              {mo.follow_ups_pending} follow-up{mo.follow_ups_pending > 1 ? 's' : ''} pending
            </p>
          )}

          {mo.calls_needed_estimate !== null && mo.calls_needed_estimate > 0 && (
            <p className="mt-2 text-xs rounded-xl px-3 py-2"
               style={{ background: 'var(--hot-primary-light)', color: 'var(--hot-primary-dark)' }}>
              At your current close rate, you need about {mo.calls_needed_estimate} more calls taken.
            </p>
          )}
          {mo.calls_taken < 10 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--hot-muted)' }}>Pace estimate needs 10+ calls taken.</p>
          )}
        </div>
      ))}

      {calls.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--hot-muted)' }}>
          No calls logged yet. Tap "Log call" to add your first.
        </p>
      )}
    </div>
  );
}
