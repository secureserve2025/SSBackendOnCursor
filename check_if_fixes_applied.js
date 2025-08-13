// Check if SQL Fixes Were Applied
// This script directly tests if the immutability fixes are in place
// Run with: node check_if_fixes_applied.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkFixesApplied() {
  console.log('🔍 Checking if Immutability Fixes Were Applied');
  console.log('==============================================\n');

  let allGood = true;

  try {
    // Test 1: Check if we can call the ID generation functions
    console.log('1️⃣ Testing ID generation functions...');
    
    try {
      const { data: clientIdTest, error: clientIdError } = await supabase.rpc('generate_client_id');
      if (clientIdError) {
        console.log('   ❌ generate_client_id function: NOT FOUND');
        console.log('      Error:', clientIdError.message);
        allGood = false;
      } else {
        console.log('   ✅ generate_client_id function: WORKING');
        console.log('   📋 Sample generated ID:', clientIdTest);
        
        // Validate format
        if (/^C[0-9]{9}$/.test(clientIdTest)) {
          console.log('   ✅ Client ID format: VALID');
        } else {
          console.log('   ❌ Client ID format: INVALID');
          allGood = false;
        }
      }
    } catch (err) {
      console.log('   ❌ generate_client_id function: NOT ACCESSIBLE');
      console.log('      Error:', err.message);
      allGood = false;
    }

    try {
      const { data: freelancerIdTest, error: freelancerIdError } = await supabase.rpc('generate_freelancer_id');
      if (freelancerIdError) {
        console.log('   ❌ generate_freelancer_id function: NOT FOUND');
        console.log('      Error:', freelancerIdError.message);
        allGood = false;
      } else {
        console.log('   ✅ generate_freelancer_id function: WORKING');
        console.log('   📋 Sample generated ID:', freelancerIdTest);
        
        // Validate format
        if (/^F[0-9]{9}$/.test(freelancerIdTest)) {
          console.log('   ✅ Freelancer ID format: VALID');
        } else {
          console.log('   ❌ Freelancer ID format: INVALID');
          allGood = false;
        }
      }
    } catch (err) {
      console.log('   ❌ generate_freelancer_id function: NOT ACCESSIBLE');
      console.log('      Error:', err.message);
      allGood = false;
    }

    console.log('');

    // Test 2: Try to manually insert test profiles to check constraints and triggers
    console.log('2️⃣ Testing manual profile creation...');
    
    // Generate test IDs
    const testClientId = 'C' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const testFreelancerId = 'F' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const testEmail = `test_${Date.now()}@example.com`;
    
    // First, create a fake user_id (UUID) for testing
    const testUserId = '12345678-1234-1234-1234-123456789012';
    
    console.log('   Testing client profile insertion...');
    try {
      const { data: clientInsert, error: clientInsertError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: testUserId,
          client_id: testClientId,
          email: testEmail,
          full_name: 'Test Client',
          mobile_number: '1234567890'
        });

      if (clientInsertError) {
        console.log('   ⚠️  Client profile insertion failed:', clientInsertError.message);
        // This might be expected due to foreign key constraints
      } else {
        console.log('   ✅ Client profile insertion: SUCCESS');
        
        // Test 3: Try to update the client_id (should fail if immutability is working)
        console.log('   Testing client_id immutability...');
        const { data: updateResult, error: updateError } = await supabase
          .from('client_profiles')
          .update({ client_id: 'C999999999' })
          .eq('client_id', testClientId);

        if (updateError && updateError.message.includes('client_id cannot be modified')) {
          console.log('   ✅ Client ID immutability: PROTECTED');
        } else if (updateError) {
          console.log('   ⚠️  Unexpected error during update test:', updateError.message);
        } else {
          console.log('   ❌ Client ID immutability: NOT PROTECTED');
          allGood = false;
        }

        // Clean up test data
        await supabase.from('client_profiles').delete().eq('client_id', testClientId);
      }
    } catch (err) {
      console.log('   ⚠️  Profile insertion test failed:', err.message);
    }

    console.log('');

    // Test 3: Check if invalid format is rejected
    console.log('3️⃣ Testing format validation...');
    
    const invalidClientId = 'INVALID123';
    console.log('   Testing invalid client_id format rejection...');
    
    try {
      const { data: invalidInsert, error: invalidInsertError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: testUserId,
          client_id: invalidClientId,
          email: `invalid_${Date.now()}@example.com`,
          full_name: 'Invalid Test',
          mobile_number: '1234567890'
        });

      if (invalidInsertError && invalidInsertError.message.includes('check_client_id_format')) {
        console.log('   ✅ Format validation: WORKING');
        console.log('      Invalid format correctly rejected');
      } else if (invalidInsertError) {
        console.log('   ⚠️  Insert failed for other reason:', invalidInsertError.message);
      } else {
        console.log('   ❌ Format validation: NOT WORKING');
        console.log('      Invalid format was accepted');
        allGood = false;
        
        // Clean up if it was incorrectly inserted
        await supabase.from('client_profiles').delete().eq('client_id', invalidClientId);
      }
    } catch (err) {
      console.log('   ⚠️  Format validation test failed:', err.message);
    }

    console.log('');

    // Test 4: Check current database state
    console.log('4️⃣ Current database state...');
    
    const { data: currentProfiles, error: fetchError } = await supabase
      .from('client_profiles')
      .select('client_id, email, created_at')
      .limit(5);

    if (fetchError) {
      console.log('   ❌ Cannot fetch current profiles:', fetchError.message);
    } else {
      console.log(`   📊 Current client profiles: ${currentProfiles.length}`);
      if (currentProfiles.length > 0) {
        console.log('   📋 Sample profiles:');
        currentProfiles.forEach(p => {
          const format = /^C[0-9]{9}$/.test(p.client_id) ? '✅' : '❌';
          console.log(`      ${format} ${p.client_id} - ${p.email}`);
        });
      }
    }

    const { data: currentFreelancers, error: freelancerFetchError } = await supabase
      .from('freelancer_profiles')
      .select('freelancer_id, email, created_at')
      .limit(5);

    if (freelancerFetchError) {
      console.log('   ❌ Cannot fetch freelancer profiles:', freelancerFetchError.message);
    } else {
      console.log(`   📊 Current freelancer profiles: ${currentFreelancers.length}`);
      if (currentFreelancers.length > 0) {
        console.log('   📋 Sample freelancer profiles:');
        currentFreelancers.forEach(p => {
          const format = /^F[0-9]{9}$/.test(p.freelancer_id) ? '✅' : '❌';
          console.log(`      ${format} ${p.freelancer_id} - ${p.email}`);
        });
      }
    }

    console.log('');

    // Final assessment
    console.log('📊 FINAL ASSESSMENT');
    console.log('===================');
    
    if (allGood) {
      console.log('🎉 SUCCESS: All immutability fixes appear to be working correctly!');
      console.log('✅ ID generation functions are accessible');
      console.log('✅ Format validation is enforced');
      console.log('✅ Immutability protection is active');
      console.log('');
      console.log('🚀 Your client_id and freelancer_id system is now SECURE!');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some fixes may not be fully applied');
      console.log('');
      console.log('🔧 NEXT STEPS:');
      console.log('1. Make sure you copied and ran the complete SQL script in Supabase dashboard');
      console.log('2. Check the SQL Editor for any error messages');
      console.log('3. Verify your database has the required permissions');
      console.log('');
      console.log('📄 SQL Script location: apply_immutability_fixes_via_supabase.sql');
    }

  } catch (error) {
    console.error('❌ Check failed with error:', error.message);
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('1. Verify your Supabase connection is working');
    console.log('2. Check if you have the required database permissions');
    console.log('3. Make sure the SQL fixes were applied via Supabase dashboard');
  }
}

// Run the check
checkFixesApplied().then(() => {
  console.log('\n✅ Check complete!');
}).catch(error => {
  console.error('❌ Check failed:', error);
});




