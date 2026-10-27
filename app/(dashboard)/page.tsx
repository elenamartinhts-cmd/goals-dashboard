import { unstable_noStore as noStore } from 'next/cache';
import { adminClient } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { SkillReview } from '@/lib/types';
import { computeMonthMetrics, computeTodayMetrics, getDataBasedTodos } from '@/lib/metrics';
import { todayMadrid, toMonthKey } from '@/lib/utils';
import { subDays, subMonths, format } from 'date-fns';
import { fetchCommissionData, sumCommissionByMonth } from '@/lib/commission-sheet';
import TodayScreen from '@/components/today/TodayScreen';

async function getReviews(): Promise<SkillReview[]> {
  noStore();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/skill_reviews?select=*&order=date.desc`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) return [];
  return res.json();
}

async function getData() {
  const db = adminClient();
  const today = todayMadrid();
  const month = toMonthKey(today);
  const yesterday = format(subDays(new Date(today), 1), 'yyyy-MM-dd');
  const prevMonthDate = subMonths(new Date(today + 'T12:00:00'), 1);
  const prevMonth = toMonthKey(format(prevMonthDate, 'yyyy-MM-dd'));

  const [callsRes, settingsRes, sheetRes, commissionRes, reviews] = await Promise.allSettled([
    db.from('calls').select('*').order('date', { ascending: false }),
    db.from('settings').select('data').eq('id', 'singleton').single(),
    db.from('sheet_cache').select('data').eq('id', 'singleton').single(),
    fetchCommissionData(),
    getReviews(),
  ]);

  const calls    = callsRes.status === 'fulfilled' ? callsRes.value.data ?? [] : [];
  const reviewsData: SkillReview[] = reviews.status === 'fulfilled' ? reviews.value : [];
  const settings = settingsRes.status === 'fulfilled' && settingsRes.value.data
    ? { ...DEFAULT_SETTINGS, ...settingsRes.value.data.data }
    : DEFAULT_SETTINGS;
  const sheetData = sheetRes.status === 'fulfilled' ? sheetRes.value.data?.data ?? null : null;
  const commissionEntries = commissionRes.status === 'fulfilled' ? commissionRes.value : [];
  const commissionByMonth = sumCommissionByMonth(commissionEntries);

  const monthMetrics     = computeMonthMetrics(calls, settings, month);
  const prevMonthMetrics = computeMonthMetrics(calls, settings, prevMonth);
  const todayMetrics     = computeTodayMetrics(calls, today);
  const yesterdayMetrics = computeTodayMetrics(calls, yesterday);
  const dataTodos        = getDataBasedTodos(monthMetrics, todayMetrics);

  const latestReview = reviewsData[0] ?? null;

  const todaySheetDay = sheetData?.weeks
    ?.flatMap((w: any) => w.days)
    ?.find((d: any) => d.date === today) ?? null;

  // Commission from tracker overrides manual log when available
  const trackerCommissionThisMonth = commissionByMonth[month] ?? null;
  const trackerCommissionPrevMonth = commissionByMonth[prevMonth] ?? null;
  const trackerEntries = commissionEntries;

  return {
    today, settings,
    monthMetrics, prevMonthMetrics,
    todayMetrics, yesterdayMetrics,
    latestReview, dataTodos, todaySheetDay,
    trackerCommissionThisMonth,
    trackerCommissionPrevMonth,
    trackerEntries,
  };
}

export default async function TodayPage() {
  const data = await getData();
  return <TodayScreen {...data} />;
}
