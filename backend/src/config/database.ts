import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database connection test
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('musicals')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Generic database query helper
export const queryDatabase = async (table: string, query: any) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(query);

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`Error querying ${table}:`, error);
    throw error;
  }
};