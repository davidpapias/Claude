'use client';

import { createClient } from '@supabase/supabase-js';
import { readEnv } from '@circulo/config';

const env = readEnv(
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  'NEXT_PUBLIC',
);

/**
 * The panel uses the moderator's own session — never the service role key.
 * Authorization lives in the database (`is_staff`), so a stolen panel build
 * cannot read or change anything the signed-in moderator could not.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
