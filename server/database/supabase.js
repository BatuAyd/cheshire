import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Also export anon client for future frontend operations if needed
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// User database functions
export const userDb = {
  // Check if user exists by wallet address
  async exists(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw error;
    }
  },

  // Get user by wallet address
  async getByWallet(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          wallet_address,
          unique_id,
          first_name,
          last_name,
          organization_id,
          organizations (
            organization_name
          ),
          created_at
        `)
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user by wallet:', error);
      throw error;
    }
  },

  // Check if unique_id is available
  async isUniqueIdAvailable(uniqueId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('unique_id')
        .eq('unique_id', uniqueId.toLowerCase())
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return !data; // Available if no data found
    } catch (error) {
      console.error('Error checking unique_id availability:', error);
      throw error;
    }
  },

  // Create new user
  async create(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          wallet_address: userData.walletAddress.toLowerCase(),
          unique_id: userData.uniqueId.toLowerCase(),
          first_name: userData.firstName,
          last_name: userData.lastName,
          organization_id: userData.organizationId || null
        }])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};

// Organization database functions
export const organizationDb = {
  // Check if organization exists
  async exists(organizationId) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('organization_id')
        .eq('organization_id', organizationId.toLowerCase())
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking organization existence:', error);
      throw error;
    }
  },

  // Get all organizations
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('organization_id, organization_name')
        .order('organization_name');
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting organizations:', error);
      throw error;
    }
  }
};