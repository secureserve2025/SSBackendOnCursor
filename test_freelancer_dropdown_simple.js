// Simple test to check freelancer dropdown issue
// Run with: node test_freelancer_dropdown_simple.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFreelancerDropdown() {
  console.log('=== TESTING FREELANCER DROPDOWN ISSUE ===\n');

  try {
    // 1. Test direct table access
    console.log('1. Testing direct freelancer_profiles table access...');
    const { data: directData, error: directError } = await supabase
      .from('freelancer_profiles')
      .select('freelancer_id, full_name, email, account_status, profile_completed')
      .limit(5);

    if (directError) {
      console.log('❌ Direct table access failed:', directError.message);
    } else {
      console.log(`✅ Direct table access successful. Found ${directData?.length || 0} freelancers:`);
      if (directData && directData.length > 0) {
        directData.forEach((freelancer, index) => {
          console.log(`   ${index + 1}. ${freelancer.freelancer_id} - ${freelancer.full_name} (${freelancer.account_status}, profile_completed: ${freelancer.profile_completed})`);
        });
      } else {
        console.log('   ℹ️  No freelancers found in table');
      }
    }

    // 2. Test the database function
    console.log('\n2. Testing get_all_active_freelancer_ids function...');
    const { data: functionData, error: functionError } = await supabase.rpc('get_all_active_freelancer_ids');

    if (functionError) {
      console.log('❌ Function call failed:', functionError.message);
    } else {
      console.log(`✅ Function call successful. Found ${functionData?.length || 0} active freelancers:`);
      if (functionData && functionData.length > 0) {
        functionData.forEach((freelancer, index) => {
          console.log(`   ${index + 1}. ${freelancer.freelancer_id} - ${freelancer.full_name} (${freelancer.email})`);
        });
      } else {
        console.log('   ℹ️  No active freelancers found by function');
      }
    }

    // 3. Test with authentication (simulate client user)
    console.log('\n3. Testing with authentication...');
    
    // First, let's see if we can find any client users
    const { data: clientData, error: clientError } = await supabase
      .from('client_profiles')
      .select('user_id, client_id, full_name, email')
      .limit(1);

    if (clientError) {
      console.log('❌ Could not fetch client profiles:', clientError.message);
    } else if (clientData && clientData.length > 0) {
      console.log(`✅ Found client: ${clientData[0].full_name} (${clientData[0].client_id})`);
      
      // Now test the function again (this simulates what happens in the app)
      console.log('   Testing function again (simulating authenticated client)...');
      const { data: authFunctionData, error: authFunctionError } = await supabase.rpc('get_all_active_freelancer_ids');
      
      if (authFunctionError) {
        console.log('   ❌ Function call with client context failed:', authFunctionError.message);
      } else {
        console.log(`   ✅ Function call with client context successful. Found ${authFunctionData?.length || 0} active freelancers`);
      }
    } else {
      console.log('ℹ️  No client profiles found');
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'freelancer_profiles');

    if (policiesError) {
      console.log('❌ Could not check RLS policies:', policiesError.message);
    } else {
      console.log(`✅ Found ${policies?.length || 0} RLS policies for freelancer_profiles:`);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
        });
      }
    }

    // 5. Summary and recommendations
    console.log('\n=== SUMMARY ===');
    
    const hasDirectAccess = !directError && directData && directData.length > 0;
    const hasFunctionAccess = !functionError && functionData && functionData.length > 0;
    const hasActiveFreelancers = hasDirectAccess && directData.some(f => f.account_status === 'active' && f.profile_completed === true);
    
    console.log(`✅ Direct table access: ${hasDirectAccess ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Function access: ${hasFunctionAccess ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Active freelancers exist: ${hasActiveFreelancers ? 'YES' : 'NO'}`);
    
    if (!hasActiveFreelancers) {
      console.log('\n🔧 RECOMMENDATION: Create an active freelancer profile');
      console.log('   - Set account_status = "active"');
      console.log('   - Set profile_completed = true');
      console.log('   - Ensure all required fields are filled');
    }
    
    if (hasDirectAccess && !hasFunctionAccess) {
      console.log('\n🔧 RECOMMENDATION: Check the database function logic');
      console.log('   - The function might be too restrictive');
      console.log('   - Check the WHERE conditions in get_all_active_freelancer_ids()');
    }
    
    if (!hasDirectAccess) {
      console.log('\n🔧 RECOMMENDATION: Check RLS policies');
      console.log('   - The table might be blocked by RLS');
      console.log('   - Ensure SELECT is allowed for authenticated users');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFreelancerDropdown();


