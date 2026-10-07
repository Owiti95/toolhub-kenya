import { createClient } from '@supabase/supabase-js';

const server = typeof window === 'undefined';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-key',
  {
    auth: { persistSession: !server, autoRefreshToken: !server, detectSessionInUrl: false },
    // On the server, make Next refresh catalogue reads every 60s (ISR) instead of caching forever.
    global: server ? { fetch: (url, opts) => fetch(url, { ...opts, next: { revalidate: 60 } }) } : {},
  },
);
