// Test to verify which Supabase project the React app is connecting to
// Run this in the browser console to check the connection

console.log('=== SUPABASE CONNECTION TEST ===');

// Check environment variables
console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);

// Test the function call directly
async function testFunctionCall() {
  try {
    console.log('Testing function call...');
    
    // Import the supabase client
    const { supabase } = await import('./src/lib/supabase.ts');
    
    console.log('Supabase client created');
    console.log('Supabase URL:', supabase.supabaseUrl);
    
    // Test the function
    const { data, error } = await supabase.rpc('validate_freelancer_complete', { 
      check_freelancer_id: 'F308208874' 
    });
    
    console.log('Function call result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data && data.length > 0) {
      console.log('✅ Function working! Result:', data[0]);
    } else {
      console.log('❌ Function not working or no data returned');
    }
    
  } catch (err) {
    console.error('❌ Error testing function:', err);
  }
}

// Run the test
testFunctionCall();
