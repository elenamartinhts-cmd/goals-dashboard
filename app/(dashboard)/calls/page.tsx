import { adminClient } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { computeMonthMetrics } from '@/lib/metrics';
import { todayMadrid, toMonthKey } from '@/lib/utils';
import CallsScreen from '@/components/calls/CallsScreen';

export default async function CallsPage() {
  const db = adminClient();
  const today = todayMadrid();
  const month = toMonthKey(today);

  const [callsRes, settingsRes] = await Promise.allSettled([
    db.from('calls').select('*').order('date', { ascending: false }),
    db.from('settings').select('data').eq('id', 'singleton').single(),
  ]);

  const calls    = callsRes.status === 'fulfilled' ? callsRes.value.data ?? [] : [];
  const settings = settingsRes.status === 'fulfilled' && settingsRes.value.data
    ? { ...DEFAULT_SETTINGS, ...settingsRes.value.data.data }
    : DEFAULT_SETTINGS;

  const monthMetrics = computeMonthMetrics(calls, settings, month);

  return <CallsScreen calls={calls} settings={settings} monthMetrics={monthMetrics} today={today} />;
}
