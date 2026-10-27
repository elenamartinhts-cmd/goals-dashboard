import { adminClient } from '@/lib/supabase';
import HabitsScreen from '@/components/habits/HabitsScreen';

export default async function HabitsPage() {
  const db = adminClient();
  const { data: cache } = await db.from('sheet_cache').select('data, fetched_at').eq('id', 'singleton').single();
  const sheetData = cache?.data ?? null;
  const fetchedAt = cache?.fetched_at ?? null;

  return <HabitsScreen sheetData={sheetData} fetchedAt={fetchedAt} />;
}
