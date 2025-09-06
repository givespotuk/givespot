// Supabase configuration for GiveSpot
const SUPABASE_URL = 'https://dubhstoftidobtoraoob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1YmhzdG9mdGlkb2J0b3Jhb29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTAyMjksImV4cCI6MjA3MjY4NjIyOX0.7UpP7D3Jvffe5I9BkfBNTwXnkp4Z0nt0aLsbIUebmX4';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('GiveSpot connected to fresh Supabase database!');

// Test database connection on load
async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        
        // Test basic connection
        const { data, error } = await supabase
            .from('charities')
            .select('name, postcode')
            .limit(1);

        if (error) {
            console.error('Database connection failed:', error.message);
            return false;
        }

        console.log('✅ Database connection successful!');
        if (data && data.length > 0) {
            console.log('Sample charity data:', data[0]);
        }
        return true;

    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        return false;
    }
}

// Run connection test when this file loads
testDatabaseConnection();