// Simple test to check if the database function is working
// Run this in the browser console

console.log('=== TESTING DROPDOWN FUNCTION ===');

// Test the function directly
async function testFunction() {
  try {
    // Import the supabase client
    const { supabase } = await import('./src/lib/supabase.ts');
    
    console.log('Testing get_all_active_freelancer_ids function...');
    
    const { data, error } = await supabase.rpc('get_all_active_freelancer_ids');
    
    console.log('Function result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data) {
      console.log('✅ Function working! Found', data.length, 'freelancers');
      data.forEach(freelancer => {
        console.log('-', freelancer.freelancer_id, freelancer.full_name, freelancer.email);
      });
    } else {
      console.log('❌ No data returned');
    }
    
  } catch (err) {
    console.error('❌ Error testing function:', err);
  }
}

// Run the test
testFunction();
