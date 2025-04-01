import { createClient } from "@supabase/supabase-js"; // Use double quotes

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL; // URL for Supabase
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY; // Anon key for Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
