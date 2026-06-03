import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rreggyuaxxciyehhqnne.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZWdneXVheHhjaXllaGhxbm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MjcwNDIsImV4cCI6MjA5NDAwMzA0Mn0.WFgqFbNUldt0_NQ-Bii-annvqQ-mpxbG5HA5Hr6tuMY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});