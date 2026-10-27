import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client (read-only public data)
export const supabase = createClient(url, anonKey);

// Server-side admin client (bypasses RLS — only used in API routes)
export function adminClient() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
