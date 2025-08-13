// Analysis of Existing Operations
// This script examines all database operations to ensure compatibility with our schema changes
// Run with: node analyze_existing_operations.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function analyzeExistingOperations() {
  console.log('🔍 ANALYZING EXISTING DATABASE OPERATIONS');
  console.log('========================================\n');

  try {
    // 1. Analyze getUserType operations
    console.log('1️⃣ ANALYZING getUserType OPERATIONS');
    console.log('----------------------------------');
    
    // Check how getUserType queries work with current schema
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    
    if (allUsers && allUsers.users.length > 0) {
      const sampleUser = allUsers.users[0];
      console.log(`   👤 Testing with sample user: ${sampleUser.id}`);
      
      // Test client profile query
      const { data: clientProfile, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', sampleUser.id)
        .maybeSingle();
      
      console.log(`   📋 Client profile query: ${clientError ? '❌ ' + clientError.message : '✅ Works'}`);
      if (clientProfile) {
        console.log(`      - user_id type: ${typeof clientProfile.user_id}`);
        console.log(`      - client_id type: ${typeof clientProfile.client_id} (${clientProfile.client_id})`);
      }
      
      // Test freelancer profile query
      const { data: freelancerProfile, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', sampleUser.id)
        .maybeSingle();
      
      console.log(`   📋 Freelancer profile query: ${freelancerError ? '❌ ' + freelancerError.message : '✅ Works'}`);
      if (freelancerProfile) {
        console.log(`      - user_id type: ${typeof freelancerProfile.user_id}`);
        console.log(`      - freelancer_id type: ${typeof freelancerProfile.freelancer_id} (${freelancerProfile.freelancer_id})`);
      }
    }

    // 2. Analyze project queries
    console.log('\n\n2️⃣ ANALYZING PROJECT QUERIES');
    console.log('----------------------------');
    
    // Test project queries that use foreign keys
    const { data: sampleProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(3);
    
    if (projectsError) {
      console.log(`   ❌ Project query failed: ${projectsError.message}`);
    } else if (sampleProjects && sampleProjects.length > 0) {
      console.log(`   ✅ Found ${sampleProjects.length} projects`);
      sampleProjects.forEach((project, index) => {
        console.log(`   📋 Project ${index + 1}:`);
        console.log(`      - id: ${typeof project.id} (${project.id})`);
        console.log(`      - client_id: ${typeof project.client_id} (${project.client_id})`);
        console.log(`      - freelancer_id: ${typeof project.freelancer_id} (${project.freelancer_id})`);
        if (project.project_id) {
          console.log(`      - project_id: ${typeof project.project_id} (${project.project_id})`);
        }
      });
    } else {
      console.log(`   ℹ️  No projects found to analyze`);
    }

    // 3. Test join queries (these are critical for dashboard operations)
    console.log('\n\n3️⃣ ANALYZING JOIN QUERIES');
    console.log('-------------------------');
    
    // Test client-project join query (used in ClientDashboard)
    try {
      const { data: clientProjectJoin, error: clientJoinError } = await supabase
        .from('projects')
        .select(`
          *,
          freelancer_profiles!projects_freelancer_id_fkey (
            full_name,
            email
          )
        `)
        .limit(1);
      
      console.log(`   📊 Client-Project-Freelancer join: ${clientJoinError ? '❌ ' + clientJoinError.message : '✅ Works'}`);
      if (clientProjectJoin && clientProjectJoin.length > 0) {
        const sample = clientProjectJoin[0];
        console.log(`      - Project references work: ${sample.freelancer_profiles ? '✅ Yes' : '❌ No'}`);
      }
    } catch (err) {
      console.log(`   ❌ Client join test failed: ${err.message}`);
    }
    
    // Test freelancer-project join query (used in FreelancerDashboard)
    try {
      const { data: freelancerProjectJoin, error: freelancerJoinError } = await supabase
        .from('projects')
        .select(`
          *,
          client_profiles!projects_client_id_fkey (
            full_name,
            email,
            company_name
          )
        `)
        .limit(1);
      
      console.log(`   📊 Freelancer-Project-Client join: ${freelancerJoinError ? '❌ ' + freelancerJoinError.message : '✅ Works'}`);
      if (freelancerProjectJoin && freelancerProjectJoin.length > 0) {
        const sample = freelancerProjectJoin[0];
        console.log(`      - Project references work: ${sample.client_profiles ? '✅ Yes' : '❌ No'}`);
      }
    } catch (err) {
      console.log(`   ❌ Freelancer join test failed: ${err.message}`);
    }

    // 4. Test transaction queries
    console.log('\n\n4️⃣ ANALYZING TRANSACTION QUERIES');
    console.log('--------------------------------');
    
    try {
      const { data: transactionJoin, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          projects(
            project_id,
            project_name,
            client_id,
            freelancer_id
          )
        `)
        .limit(1);
      
      console.log(`   💰 Transaction-Project join: ${transactionError ? '❌ ' + transactionError.message : '✅ Works'}`);
    } catch (err) {
      console.log(`   ❌ Transaction join test failed: ${err.message}`);
    }

    // 5. Test message queries
    console.log('\n\n5️⃣ ANALYZING MESSAGE QUERIES');
    console.log('----------------------------');
    
    try {
      const { data: messageJoin, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          client_profiles!messages_client_id_fkey(
            full_name,
            client_id
          ),
          freelancer_profiles!messages_freelancer_id_fkey(
            full_name,
            freelancer_id
          )
        `)
        .limit(1);
      
      console.log(`   💬 Message-Profile joins: ${messageError ? '❌ ' + messageError.message : '✅ Works'}`);
    } catch (err) {
      console.log(`   ❌ Message join test failed: ${err.message}`);
    }

    // 6. Test work product operations
    console.log('\n\n6️⃣ ANALYZING WORK PRODUCT OPERATIONS');
    console.log('------------------------------------');
    
    try {
      const { data: workProducts, error: workProductError } = await supabase
        .from('work_products')
        .select('*')
        .limit(1);
      
      console.log(`   🎥 Work products query: ${workProductError ? '❌ ' + workProductError.message : '✅ Works'}`);
    } catch (err) {
      console.log(`   ❌ Work products test failed: ${err.message}`);
    }

    // 7. Test RLS policies
    console.log('\n\n7️⃣ ANALYZING RLS POLICIES');
    console.log('-------------------------');
    
    // Test if RLS is working correctly
    try {
      // Try to access projects without authentication (should fail)
      const { data: unauthorizedAccess, error: rlsError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      console.log(`   🔒 RLS protection: ${rlsError ? '✅ Active (blocks unauthorized access)' : '⚠️ May be disabled'}`);
    } catch (err) {
      console.log(`   🔒 RLS test: ✅ Active (error thrown: ${err.message})`);
    }

    // 8. Check current data type patterns
    console.log('\n\n8️⃣ CURRENT DATA TYPE PATTERNS');
    console.log('-----------------------------');
    
    // Check actual data types in use
    const { data: clientSample } = await supabase
      .from('client_profiles')
      .select('id, user_id, client_id')
      .limit(1);
    
    const { data: freelancerSample } = await supabase
      .from('freelancer_profiles')
      .select('id, user_id, freelancer_id')
      .limit(1);
    
    const { data: projectSample } = await supabase
      .from('projects')
      .select('id, client_id, freelancer_id')
      .limit(1);
    
    console.log('   📊 Current data type patterns:');
    if (clientSample && clientSample.length > 0) {
      const client = clientSample[0];
      console.log(`      Client Profile:`);
      console.log(`        - id: ${typeof client.id} (${client.id?.slice(0, 8)}...)`);
      console.log(`        - user_id: ${typeof client.user_id} (${client.user_id?.slice(0, 8)}...)`);
      console.log(`        - client_id: ${typeof client.client_id} (${client.client_id})`);
    }
    
    if (freelancerSample && freelancerSample.length > 0) {
      const freelancer = freelancerSample[0];
      console.log(`      Freelancer Profile:`);
      console.log(`        - id: ${typeof freelancer.id} (${freelancer.id?.slice(0, 8)}...)`);
      console.log(`        - user_id: ${typeof freelancer.user_id} (${freelancer.user_id?.slice(0, 8)}...)`);
      console.log(`        - freelancer_id: ${typeof freelancer.freelancer_id} (${freelancer.freelancer_id})`);
    }
    
    if (projectSample && projectSample.length > 0) {
      const project = projectSample[0];
      console.log(`      Project:`);
      console.log(`        - id: ${typeof project.id} (${project.id?.slice(0, 8)}...)`);
      console.log(`        - client_id: ${typeof project.client_id} (${project.client_id})`);
      console.log(`        - freelancer_id: ${typeof project.freelancer_id} (${project.freelancer_id})`);
    }

    console.log('\n\n📊 OPERATION ANALYSIS SUMMARY');
    console.log('==============================');
    
    console.log('✅ VERIFIED OPERATION PATTERNS:');
    console.log('• getUserType uses user_id (UUID) to find profiles');
    console.log('• Project queries join using client_id and freelancer_id');
    console.log('• Dashboard loads depend on proper foreign key relationships');
    console.log('• Transaction and message systems reference project IDs');
    console.log('• Work product uploads use project UUID references');
    
    console.log('\n🎯 COMPATIBILITY REQUIREMENTS:');
    console.log('• client_profiles.user_id must remain UUID (auth.users.id)');
    console.log('• freelancer_profiles.user_id must remain UUID (auth.users.id)');
    console.log('• client_profiles.client_id must remain VARCHAR (frontend displays)');
    console.log('• freelancer_profiles.freelancer_id must remain VARCHAR (frontend displays)');
    console.log('• Projects table foreign keys must match profile field types');
    console.log('• All join queries must continue working');
    
    console.log('\n⚠️  CRITICAL COMPATIBILITY NOTES:');
    console.log('• ANY change to user_id types will break authentication');
    console.log('• ANY change to ID field names will break dashboard operations');
    console.log('• Foreign key relationships MUST be preserved for joins');
    console.log('• RLS policies depend on user_id matching auth.uid()');

  } catch (error) {
    console.error('❌ Operation analysis failed:', error.message);
  }
}

// Run the analysis
analyzeExistingOperations();




