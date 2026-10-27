import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { type Call, type AppSettings, type MonthMetrics, type PaceBadge } from './types';
import {
  workingDaysInMonth,
  workingDaysElapsed,
  todayMadrid,
  toMonthKey,
  isWarmup,
} from './utils';

export function computeMonthMetrics(
  calls: Call[],
  settings: AppSettings,
  yearMonth: string   // 'YYYY-MM'
): MonthMetrics {
  const today = todayMadrid();
  const monthCalls = calls.filter(c => toMonthKey(c.date) === yearMonth);

  const calls_booked   = monthCalls.length;
  const calls_taken    = monthCalls.filter(c => c.showed).length;
  const no_shows       = monthCalls.filter(c => !c.showed).length;
  const no_show_pct    = calls_booked > 0 ? (no_shows / calls_booked) * 100 : null;

  const closes         = monthCalls.filter(c => c.outcome === 'closed').length;
  const close_pct      = calls_taken > 0 ? (closes / calls_taken) * 100 : null;

  const coreOfferIds   = new Set(settings.offers.filter(o => o.is_core).map(o => o.id));
  const core_closes    = monthCalls.filter(
    c => c.outcome === 'closed' && c.offer_id && coreOfferIds.has(c.offer_id)
  ).length;

  const commission_earned = monthCalls
    .filter(c => c.outcome === 'closed' && c.commission !== null)
    .reduce((sum, c) => sum + (c.commission ?? 0), 0);

  const commission_pending = monthCalls
    .filter(c => c.outcome === 'deposit' && c.commission !== null)
    .reduce((sum, c) => sum + (c.commission ?? 0), 0);

  const follow_ups_pending = monthCalls.filter(c => c.outcome === 'follow_up').length;

  const income_goal    = settings.income_goal;
  const core_target    = settings.core_closes_target;
  const money_left     = Math.max(0, income_goal - commission_earned);

  const wdTotal        = workingDaysInMonth(yearMonth, settings.working_days);
  const wdElapsed      = workingDaysElapsed(yearMonth, today, settings.working_days);
  const wdRemaining    = Math.max(0, wdTotal - wdElapsed);

  // Pace: straight-line against core closes target
  let pace_badge: PaceBadge = 'not_started';
  if (wdElapsed > 0) {
    const targetByNow = (wdElapsed / wdTotal) * core_target;
    if (core_closes > targetByNow + 0.49)       pace_badge = 'ahead';
    else if (core_closes < targetByNow - 0.49)  pace_badge = 'behind';
    else                                          pace_badge = 'on_pace';
  }

  // Calls needed estimate (only when 10+ calls taken)
  let calls_needed_estimate: number | null = null;
  if (calls_taken >= 10 && close_pct !== null && close_pct > 0) {
    const closesNeeded = Math.max(0, core_target - core_closes);
    if (closesNeeded > 0) {
      const rate = closes / calls_taken;
      calls_needed_estimate = Math.ceil(closesNeeded / rate);
    } else {
      calls_needed_estimate = 0;
    }
  }

  return {
    month: yearMonth,
    calls_booked,
    calls_taken,
    no_shows,
    no_show_pct,
    closes,
    close_pct,
    core_closes,
    commission_earned,
    commission_pending,
    follow_ups_pending,
    income_goal,
    core_target,
    money_left,
    working_days_total: wdTotal,
    working_days_elapsed: wdElapsed,
    working_days_remaining: wdRemaining,
    pace_badge,
    calls_needed_estimate,
  };
}

// Metrics for "today" slice
export function computeTodayMetrics(calls: Call[], today: string) {
  const todayCalls = calls.filter(c => c.date === today);
  return {
    calls_taken:       todayCalls.filter(c => c.showed).length,
    no_shows:          todayCalls.filter(c => !c.showed).length,
    closes:            todayCalls.filter(c => c.outcome === 'closed').length,
    commission_earned: todayCalls
      .filter(c => c.outcome === 'closed')
      .reduce((s, c) => s + (c.commission ?? 0), 0),
  };
}

// Get data-based to-do suggestions
export function getDataBasedTodos(
  monthMetrics: MonthMetrics,
  todayMetrics: ReturnType<typeof computeTodayMetrics>
): string[] {
  const ideas: string[] = [];
  if (monthMetrics.no_show_pct !== null && monthMetrics.no_show_pct > 25) {
    ideas.push("Send a confirmation message to tomorrow's booked calls");
  }
  if (monthMetrics.pace_badge === 'behind') {
    ideas.push('Review your last lost call before the shift');
  }
  return ideas.slice(0, 2);
}
