import { unstable_noStore as noStore } from 'next/cache';
import type { SkillReview } from '@/lib/types';
import SkillsScreen from '@/components/skills/SkillsScreen';

export const dynamic = 'force-dynamic';

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

export default async function SkillsPage() {
  const reviews = await getReviews();
  return <SkillsScreen reviews={reviews} />;
}
