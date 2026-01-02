import { createClient } from '@supabase/supabase-js';

const V = (import.meta as any).env || {};
const SUPABASE_URL =
  V.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  V.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const IS_SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// breadcrumb in console
console.log('[SUPABASE] URL:', SUPABASE_URL || 'MISSING');
console.log('[SUPABASE] ANON:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 6) + '…' : 'MISSING');
