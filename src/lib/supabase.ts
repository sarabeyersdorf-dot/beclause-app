import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// One instance only, with a unique storageKey
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    storageKey: 'beclause-auth', // avoid default key collisions between builds
  },
});
