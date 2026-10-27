import { adminClient } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/types';
import SettingsScreen from '@/components/settings/SettingsScreen';

export default async function SettingsPage() {
  const db = adminClient();
  const { data } = await db.from('settings').select('data').eq('id', 'singleton').single();
  const settings = data ? { ...DEFAULT_SETTINGS, ...data.data } : DEFAULT_SETTINGS;
  return <SettingsScreen initial={settings} />;
}
