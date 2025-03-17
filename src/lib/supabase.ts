import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" to set up your project.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'nesttask@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Add retry configuration
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // Add retry logic
      signal: options.signal,
    }).catch(async error => {
      console.error('Fetch error:', error);
      // Retry the request up to 3 times with exponential backoff
      for (let i = 0; i < 3; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          const response = await fetch(url, options);
          return response;
        } catch (retryError) {
          console.error(`Retry ${i + 1} failed:`, retryError);
          if (i === 2) throw retryError; // Throw on final retry
        }
      }
      throw error;
    });
  }
});

// Initialize connection state
let isInitialized = false;

// Function to test connection
export async function testConnection() {
  if (isInitialized) return true;
  
  try {
    const { error } = await supabase.from('tasks').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    
    isInitialized = true;
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error: any) {
    console.error('Failed to connect to Supabase:', error.message);
    return false;
  }
}

// Test connection immediately
testConnection().catch(console.error);