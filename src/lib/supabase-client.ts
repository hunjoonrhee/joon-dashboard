import { supabase } from '@/lib/supabase';

export function createSupabaseBrowserClient() {
  return supabase;
}
