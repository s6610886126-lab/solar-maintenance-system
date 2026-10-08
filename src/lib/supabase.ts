import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lfaawqiyxdqrncwpvfib.supabase.co';
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
    const errMsg = error.message || 'Connection failed';
    if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
      return { 
        connected: false, 
        hasTables: false, 
        error: 'Cannot reach Supabase Server URL. Please verify your Project URL and Anon Key in Supabase Dashboard (or project might be paused).' 
      };
    }
    return { connected: false, hasTables: false, error: errMsg };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
      return { 
        connected: false, 
        hasTables: false, 
        error: 'Cannot reach Supabase Server URL. Please verify your Project URL and Anon Key in Supabase Dashboard.' 
      };
    }
    return { connected: false, hasTables: false, error: msg || 'Connection failed' };
  }
};
