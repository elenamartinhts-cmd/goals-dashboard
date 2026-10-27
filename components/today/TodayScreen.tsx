'use client';

import type { AppSettings, MonthMetrics, SkillReview } from '@/lib/types';
import MorningView from './MorningView';

interface Props {
  today: string;
  settings: AppSettings;
  monthMetrics: MonthMetrics;
  prevMonthMetrics: MonthMetrics;
  todayMetrics: { calls_taken: number; no_shows: number; closes: number; commission_earned: number };
  yesterdayMetrics: { calls_taken: number; no_shows: number; closes: number; commission_earned: number };
  latestReview: SkillReview | null;
  dataTodos: string[];
  todaySheetDay: any | null;
  trackerCommissionThisMonth: number | null;
  trackerCommissionPrevMonth: number | null;
  trackerEntries: any[];
}

export default function TodayScreen(props: Props) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--hot-bg)' }}>
      <div className="px-5 pt-5 pb-1 safe-top">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--hot-muted)' }}>
          {new Date(props.today).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <MorningView {...props} />
      </div>
    </div>
  );
}
