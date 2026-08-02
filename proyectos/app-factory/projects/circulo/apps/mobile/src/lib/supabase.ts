import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { readEnv } from '@circulo/config';

export const env = readEnv(process.env as Record<string, string | undefined>, 'EXPO_PUBLIC');

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Sessions are restored from storage; the app never parses tokens from a URL.
    detectSessionInUrl: false,
  },
});
