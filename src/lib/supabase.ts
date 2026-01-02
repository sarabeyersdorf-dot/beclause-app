import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars:', { SUPABASE_URL, hasAnon: !!SUPABASE_ANON_KEY });
  throw new Error('Supabase env vars not configured');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
