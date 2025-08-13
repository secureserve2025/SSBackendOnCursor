// Direct Schema Check
// This script directly queries the tables to understand their structure
// Run with: node direct_schema_check.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 DIRECT SCHEMA EXAMINATION');
  console.log('============================\n');

  try {
    // 1. Test project table structure by attempting operations
    console.log('1️⃣ TESTING PROJECTS TABLE STRUCTURE');
    console.log('-----------------------------------');
    
    // Try to insert a test project to understand the expected schema
    console.log('Testing project table schema by attempting insert...');
    
    // First, let's see if we can get any existing projects to understand structure
    try {
      const { data: existingProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      if (projectsError) {
        console.log('   ❌ Error querying projects:', projectsError.message);
      } else if (existingProjects && existingProjects.length > 0) {
        console.log('   ✅ Found existing project data:');
        const project = existingProjects[0];
        console.log('   📊 Project Structure:');
        Object.keys(project).forEach(key => {
          const value = project[key];
          const type = typeof value;
          console.log(`      - ${key}: ${value} (${type})`);
        });
      } else {
        console.log('   ℹ️  No existing projects found');
        
        // Try to understand the table structure by attempting a minimal insert
        console.log('\n   Testing minimal project insert to understand schema...');
        
        // Try with UUID pattern first
        try {
          const testInsert1 = await supabase
            .from('projects')
            .insert({
              project_name: 'TEST_PROJECT_SCHEMA_CHECK',
              client_id: '00000000-0000-0000-0000-000000000000',
              freelancer_id: '00000000-0000-0000-0000-000000000000'
            })
            .select();
            
          console.log('   ✅ UUID pattern works:', testInsert1.error?.message || 'Success');
          
          // Clean up test data if successful
          if (testInsert1.data && testInsert1.data.length > 0) {
            await supabase.from('projects').delete().eq('project_name', 'TEST_PROJECT_SCHEMA_CHECK');
          }
        } catch (err) {
          console.log('   ❌ UUID pattern failed:', err.message);
        }
        
        // Try with VARCHAR pattern
        try {
          const testInsert2 = await supabase
            .from('projects')
            .insert({
              project_name: 'TEST_PROJECT_SCHEMA_CHECK_2',
              client_id: 'C000000000',
              freelancer_id: 'F000000000'
            })
            .select();
            
          console.log('   ✅ VARCHAR pattern works:', testInsert2.error?.message || 'Success');
          
          // Clean up test data if successful
          if (testInsert2.data && testInsert2.data.length > 0) {
            await supabase.from('projects').delete().eq('project_name', 'TEST_PROJECT_SCHEMA_CHECK_2');
          }
        } catch (err) {
          console.log('   ❌ VARCHAR pattern failed:', err.message);
        }
      }
    } catch (err) {
      console.log('   ❌ Error testing projects table:', err.message);
    }

    // 2. Test profile tables structure
    console.log('\n\n2️⃣ TESTING PROFILE TABLES STRUCTURE');
    console.log('-----------------------------------');
    
    // Test client profiles
    try {
      const { data: clientProfiles, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .limit(1);
      
      if (clientError) {
        console.log('   ❌ Error querying client_profiles:', clientError.message);
      } else if (clientProfiles && clientProfiles.length > 0) {
        console.log('   ✅ Client Profiles Structure:');
        const client = clientProfiles[0];
        Object.keys(client).forEach(key => {
          const value = client[key];
          const type = typeof value;
          console.log(`      - ${key}: ${value} (${type})`);
        });
      } else {
        console.log('   ℹ️  No client profiles found');
      }
    } catch (err) {
      console.log('   ❌ Error with client_profiles:', err.message);
    }
    
    // Test freelancer profiles
    try {
      const { data: freelancerProfiles, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .limit(1);
      
      if (freelancerError) {
        console.log('   ❌ Error querying freelancer_profiles:', freelancerError.message);
      } else if (freelancerProfiles && freelancerProfiles.length > 0) {
        console.log('   ✅ Freelancer Profiles Structure:');
        const freelancer = freelancerProfiles[0];
        Object.keys(freelancer).forEach(key => {
          const value = freelancer[key];
          const type = typeof value;
          console.log(`      - ${key}: ${value} (${type})`);
        });
      } else {
        console.log('   ℹ️  No freelancer profiles found');
      }
    } catch (err) {
      console.log('   ❌ Error with freelancer_profiles:', err.message);
    }

    // 3. Test function availability
    console.log('\n\n3️⃣ TESTING FUNCTION AVAILABILITY');
    console.log('---------------------------------');
    
    // Test ID generation functions
    try {
      const { data: clientIdData, error: clientIdError } = await supabase.rpc('generate_client_id');
      console.log(`   📝 generate_client_id: ${clientIdError ? '❌ ' + clientIdError.message : '✅ ' + clientIdData}`);
    } catch (err) {
      console.log(`   📝 generate_client_id: ❌ ${err.message}`);
    }
    
    try {
      const { data: freelancerIdData, error: freelancerIdError } = await supabase.rpc('generate_freelancer_id');
      console.log(`   📝 generate_freelancer_id: ${freelancerIdError ? '❌ ' + freelancerIdError.message : '✅ ' + freelancerIdData}`);
    } catch (err) {
      console.log(`   📝 generate_freelancer_id: ❌ ${err.message}`);
    }

    // Test validation functions
    try {
      const { data: validateData, error: validateError } = await supabase.rpc('validate_freelancer_id', { freelancer_id_param: 'F123456789' });
      console.log(`   📝 validate_freelancer_id: ${validateError ? '❌ ' + validateError.message : '✅ Available'}`);
    } catch (err) {
      console.log(`   📝 validate_freelancer_id: ❌ ${err.message}`);
    }

    // 4. Test authentication triggers
    console.log('\n\n4️⃣ TESTING AUTHENTICATION SYSTEM');
    console.log('---------------------------------');
    
    // Check if profile creation functions exist
    try {
      const { data: authTestData, error: authTestError } = await supabase.rpc('handle_new_client');
      console.log(`   🔐 handle_new_client: ${authTestError ? '❌ ' + authTestError.message : '✅ Available'}`);
    } catch (err) {
      console.log(`   🔐 handle_new_client: ❌ ${err.message}`);
    }
    
    try {
      const { data: authTestData2, error: authTestError2 } = await supabase.rpc('handle_new_freelancer');
      console.log(`   🔐 handle_new_freelancer: ${authTestError2 ? '❌ ' + authTestError2.message : '✅ Available'}`);
    } catch (err) {
      console.log(`   🔐 handle_new_freelancer: ❌ ${err.message}`);
    }

    // 5. Test email uniqueness across tables
    console.log('\n\n5️⃣ EMAIL UNIQUENESS TEST');
    console.log('------------------------');
    
    const { data: allClientEmails } = await supabase
      .from('client_profiles')
      .select('email');
    
    const { data: allFreelancerEmails } = await supabase
      .from('freelancer_profiles')
      .select('email');
    
    if (allClientEmails && allFreelancerEmails) {
      const clientEmailSet = new Set(allClientEmails.map(c => c.email));
      const freelancerEmailSet = new Set(allFreelancerEmails.map(f => f.email));
      
      const duplicates = [...clientEmailSet].filter(email => freelancerEmailSet.has(email));
      
      console.log(`   📧 Client emails: ${clientEmailSet.size}`);
      console.log(`   📧 Freelancer emails: ${freelancerEmailSet.size}`);
      console.log(`   ⚠️  Duplicate emails across tables: ${duplicates.length}`);
      
      if (duplicates.length > 0) {
        console.log('   🚨 DUPLICATE EMAILS FOUND:');
        duplicates.forEach(email => console.log(`      - ${email}`));
      }
    }

    console.log('\n\n📊 DIRECT SCHEMA CHECK SUMMARY');
    console.log('==============================');
    console.log('This analysis helps us understand:');
    console.log('1. What table structure is actually deployed');
    console.log('2. Which functions are available');
    console.log('3. Current data patterns and constraints');
    console.log('4. Email usage patterns');
    
    console.log('\n🎯 Based on the results above, we can now:');
    console.log('1. Identify the correct schema pattern to standardize on');
    console.log('2. Plan the authentication and validation improvements');
    console.log('3. Ensure all changes are compatible with existing data');

  } catch (error) {
    console.error('❌ Direct schema check failed:', error.message);
  }
}

// Run the check
checkSchema();




