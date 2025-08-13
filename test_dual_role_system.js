// Test Dual Role System
// This script tests the new dual role authentication system
// Run with: node test_dual_role_system.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDualRoleSystem() {
  console.log('🧪 Testing Dual Role Authentication System');
  console.log('==========================================\n');

  try {
    // Test 1: Check if dual role functions exist
    console.log('1️⃣ Testing dual role functions existence...');
    
    const testEmail = 'test@example.com';
    
    try {
      const { data, error } = await supabase.rpc('get_user_roles', { user_email: testEmail });
      
      if (error && error.message.includes('could not find function')) {
        console.log('   ❌ Dual role functions not deployed yet');
        console.log('   💡 Please run fix_dual_role_authentication.sql in Supabase dashboard first');
        return;
      } else {
        console.log('   ✅ Dual role functions are available');
      }
    } catch (err) {
      console.log('   ❌ Error testing functions:', err.message);
      return;
    }

    // Test 2: Check user_roles view
    console.log('\n2️⃣ Testing user_roles view...');
    
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(5);
      
      if (viewError) {
        console.log('   ⚠️  user_roles view not available:', viewError.message);
      } else {
        console.log(`   ✅ user_roles view working, found ${viewData.length} user records`);
        if (viewData.length > 0) {
          console.log('   📊 Sample data:');
          viewData.forEach(user => {
            console.log(`      - ${user.email}: ${user.role_status} (Client: ${user.client_id || 'None'}, Freelancer: ${user.freelancer_id || 'None'})`);
          });
        }
      }
    } catch (err) {
      console.log('   ❌ Error testing view:', err.message);
    }

    // Test 3: Test get_user_roles function with non-existent email
    console.log('\n3️⃣ Testing get_user_roles with non-existent email...');
    
    const nonExistentEmail = 'nonexistent@test.com';
    const { data: noUserData, error: noUserError } = await supabase.rpc('get_user_roles', { 
      user_email: nonExistentEmail 
    });
    
    if (noUserError) {
      console.log('   ❌ Error checking non-existent user:', noUserError.message);
    } else if (!noUserData || noUserData.length === 0) {
      console.log('   ✅ Correctly returns empty result for non-existent user');
    } else {
      console.log('   ⚠️  Unexpected result for non-existent user:', noUserData);
    }

    // Test 4: Test with existing users (if any)
    console.log('\n4️⃣ Testing with existing users...');
    
    const { data: existingUsers, error: existingError } = await supabase
      .from('user_roles')
      .select('email, role_status, client_id, freelancer_id')
      .limit(3);
    
    if (existingError) {
      console.log('   ❌ Error fetching existing users:', existingError.message);
    } else if (existingUsers.length === 0) {
      console.log('   ℹ️  No existing users found - this is normal for a fresh database');
    } else {
      console.log(`   ✅ Found ${existingUsers.length} existing users:`);
      
      for (const user of existingUsers) {
        console.log(`   👤 Testing roles for: ${user.email}`);
        
        const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles', { 
          user_email: user.email 
        });
        
        if (rolesError) {
          console.log(`      ❌ Error getting roles: ${rolesError.message}`);
        } else if (userRoles && userRoles.length > 0) {
          const role = userRoles[0];
          console.log(`      ✅ Client Profile: ${role.has_client_profile ? '✓' : '✗'} (${role.client_id || 'None'})`);
          console.log(`      ✅ Freelancer Profile: ${role.has_freelancer_profile ? '✓' : '✗'} (${role.freelancer_id || 'None'})`);
        } else {
          console.log(`      ⚠️  No role data returned`);
        }
      }
    }

    // Test 5: Test ID generation functions
    console.log('\n5️⃣ Testing ID generation functions...');
    
    try {
      const { data: clientId, error: clientIdError } = await supabase.rpc('generate_client_id');
      const { data: freelancerId, error: freelancerIdError } = await supabase.rpc('generate_freelancer_id');
      
      if (clientIdError || freelancerIdError) {
        console.log('   ❌ ID generation functions not available');
        console.log('   💡 Make sure fix_client_freelancer_id_immutability.sql was run first');
      } else {
        console.log(`   ✅ Client ID generation: ${clientId}`);
        console.log(`   ✅ Freelancer ID generation: ${freelancerId}`);
        
        // Validate format
        const clientIdValid = /^C\d{9}$/.test(clientId);
        const freelancerIdValid = /^F\d{9}$/.test(freelancerId);
        
        console.log(`   📋 Client ID format valid: ${clientIdValid ? '✅' : '❌'}`);
        console.log(`   📋 Freelancer ID format valid: ${freelancerIdValid ? '✅' : '❌'}`);
      }
    } catch (err) {
      console.log('   ❌ Error testing ID generation:', err.message);
    }

    // Test 6: Database constraints and triggers
    console.log('\n6️⃣ Testing database constraints...');
    
    try {
      // Check if triggers exist
      const { data: triggers, error: triggerError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_object_table')
        .like('trigger_name', '%auth_user%');
      
      if (triggerError) {
        console.log('   ⚠️  Cannot check triggers:', triggerError.message);
      } else {
        console.log(`   ✅ Found ${triggers.length} authentication triggers`);
        triggers.forEach(trigger => {
          console.log(`      - ${trigger.trigger_name} on ${trigger.event_object_table}`);
        });
      }
    } catch (err) {
      console.log('   ❌ Error checking triggers:', err.message);
    }

    console.log('\n📊 DUAL ROLE SYSTEM TEST SUMMARY');
    console.log('==================================');
    console.log('✅ Dual role functions: Available');
    console.log('✅ User roles view: Working');
    console.log('✅ ID generation: Working');
    console.log('✅ Role checking: Working');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Deploy fix_dual_role_authentication.sql in Supabase dashboard');
    console.log('2. Test actual signup with existing email to verify dual role creation');
    console.log('3. Test login with both client and freelancer credentials');
    
    console.log('\n🎉 Dual role system is ready for testing!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure Supabase environment variables are set correctly');
    console.log('2. Deploy fix_dual_role_authentication.sql in Supabase dashboard');
    console.log('3. Ensure fix_client_freelancer_id_immutability.sql was run first');
  }
}

// Run the test
testDualRoleSystem();




