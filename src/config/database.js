const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// DEBUG: Print environment variables
console.log('🔍 Environment Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET (hidden)' : 'MISSING');
console.log('---');

// Create Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

console.log(' Supabase client initialized');

module.exports = supabase;