import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'armwrestling-auth',
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  is_test_user: boolean;
  created_at: string;
  updated_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_type: string;
  duration_minutes: number;
  intensity: number;
  notes: string;
  cycle_id: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string;
};

export type Goal = {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
};

export type StrengthTest = {
  id: string;
  user_id: string;
  test_type: string;
  result_value: number;
  notes: string;
  created_at: string;
};

export type Cycle = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  cycle_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};
