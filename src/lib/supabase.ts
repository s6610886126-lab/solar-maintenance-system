import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ueldtynpoyrghcaoewhj.supabase.co';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbGR0eW5wb3lyZ2hjYW9ld2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3OTg3NjIsImV4cCI6MjA5ODM3NDc2Mn0.i6WlVVzM_v6wncwWsepWrOaXygjvUWxJWsJsyySn02I';

// Check for user-customized credentials in localStorage
export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('SOLAR_SUPABASE_URL');
  const customKey = localStorage.getItem('SOLAR_SUPABASE_KEY');
  return {
    url: customUrl || defaultUrl,
    key: customKey || defaultKey,
    isCustom: !!customUrl,
  };
};

export const setSupabaseConfig = (url: string, key: string) => {
  if (url) localStorage.setItem('SOLAR_SUPABASE_URL', url.trim());
  else localStorage.removeItem('SOLAR_SUPABASE_URL');

  if (key) localStorage.setItem('SOLAR_SUPABASE_KEY', key.trim());
  else localStorage.removeItem('SOLAR_SUPABASE_KEY');
  
  // Reload client
  initSupabase();
};

let clientInstance: SupabaseClient | null = null;

export const initSupabase = (): SupabaseClient => {
  const { url, key } = getSupabaseConfig();
  clientInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  return clientInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!clientInstance) {
    return initSupabase();
  }
  return clientInstance;
};

export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  hasTables: boolean;
  error?: string;
}> => {
  try {
    const supabase = getSupabase();
    // Test if queue_state table exists
    const { error } = await supabase.from('queue_state').select('*').limit(1);
    if (!error) {
      return { connected: true, hasTables: true };
    }
    // If error contains relation does not exist
    if (error.message && (error.message.includes('relation') || error.message.includes('schema cache'))) {
      return { connected: true, hasTables: false, error: 'Database connected, but tables not created yet. Run supabase_schema.sql in SQL Editor.' };
    }
    return { connected: false, hasTables: false, error: error.message };
  } catch (err: any) {
    return { connected: false, hasTables: false, error: err.message || 'Connection failed' };
  }
};
