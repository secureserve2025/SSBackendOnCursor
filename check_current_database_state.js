// Check Current Database State
// This script checks what schema is actually deployed in your database
// Run with: node check_current_database_state.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabaseState() {
  console.log('🔍 Checking Current Database State');
  console.log('==================================\n');

  try {
    // Check if tables exist and their structure
    console.log('1️⃣ Checking table existence...');
    
    const tables = ['client_profiles', 'freelancer_profiles', 'projects', 'transactions', 'deliverables', 'project_files'];
    const tableExistence = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        tableExistence[table] = !error;
        console.log(`   ${tableExistence[table] ? '✅' : '❌'} ${table}: ${tableExistence[table] ? 'EXISTS' : 'MISSING'}`);
      } catch (err) {
        tableExistence[table] = false;
        console.log(`   ❌ ${table}: ERROR - ${err.message}`);
      }
    }

    // Check profile table structure
    console.log('\n2️⃣ Checking profile table structure...');
    
    if (tableExistence.client_profiles) {
      try {
        const { data: clientSample } = await supabase
          .from('client_profiles')
          .select('*')
          .limit(1);
        
        if (clientSample && clientSample.length > 0) {
          const clientProfile = clientSample[0];
          console.log('   ✅ Client Profile Sample Structure:');
          console.log(`      - id: ${typeof clientProfile.id} (${clientProfile.id?.length || 'N/A'} chars)`);
          console.log(`      - client_id: ${typeof clientProfile.client_id} (${clientProfile.client_id?.length || 'N/A'} chars)`);
          console.log(`      - user_id: ${typeof clientProfile.user_id} (${clientProfile.user_id?.length || 'N/A'} chars)`);
          console.log(`      - email: ${typeof clientProfile.email}`);
          console.log(`      - Sample client_id: ${clientProfile.client_id}`);
        } else {
          console.log('   ℹ️  No client profiles found');
        }
      } catch (err) {
        console.log(`   ❌ Error reading client profiles: ${err.message}`);
      }
    }

    if (tableExistence.freelancer_profiles) {
      try {
        const { data: freelancerSample } = await supabase
          .from('freelancer_profiles')
          .select('*')
          .limit(1);
        
        if (freelancerSample && freelancerSample.length > 0) {
          const freelancerProfile = freelancerSample[0];
          console.log('   ✅ Freelancer Profile Sample Structure:');
          console.log(`      - id: ${typeof freelancerProfile.id} (${freelancerProfile.id?.length || 'N/A'} chars)`);
          console.log(`      - freelancer_id: ${typeof freelancerProfile.freelancer_id} (${freelancerProfile.freelancer_id?.length || 'N/A'} chars)`);
          console.log(`      - user_id: ${typeof freelancerProfile.user_id} (${freelancerProfile.user_id?.length || 'N/A'} chars)`);
          console.log(`      - email: ${typeof freelancerProfile.email}`);
          console.log(`      - Sample freelancer_id: ${freelancerProfile.freelancer_id}`);
        } else {
          console.log('   ℹ️  No freelancer profiles found');
        }
      } catch (err) {
        console.log(`   ❌ Error reading freelancer profiles: ${err.message}`);
      }
    }

    // Check projects table structure
    console.log('\n3️⃣ Checking projects table structure...');
    
    if (tableExistence.projects) {
      try {
        const { data: projectSample } = await supabase
          .from('projects')
          .select('*')
          .limit(1);
        
        if (projectSample && projectSample.length > 0) {
          const project = projectSample[0];
          console.log('   ✅ Project Sample Structure:');
          console.log(`      - id: ${typeof project.id} (${project.id?.length || 'N/A'} chars)`);
          console.log(`      - project_id: ${typeof project.project_id} (${project.project_id?.length || 'N/A'} chars)`);
          console.log(`      - client_id: ${typeof project.client_id} (${project.client_id?.length || 'N/A'} chars)`);
          console.log(`      - freelancer_id: ${typeof project.freelancer_id} (${project.freelancer_id?.length || 'N/A'} chars)`);
          console.log(`      - Sample client_id: ${project.client_id}`);
          console.log(`      - Sample freelancer_id: ${project.freelancer_id}`);
          console.log(`      - Sample project_id: ${project.project_id}`);
        } else {
          console.log('   ℹ️  No projects found');
        }
      } catch (err) {
        console.log(`   ❌ Error reading projects: ${err.message}`);
      }
    }

    // Check foreign key relationships by testing joins
    console.log('\n4️⃣ Testing foreign key relationships...');
    
    if (tableExistence.projects && tableExistence.client_profiles && tableExistence.freelancer_profiles) {
      try {
        // Test client relationship
        const { data: clientJoin, error: clientJoinError } = await supabase
          .from('projects')
          .select(`
            id,
            client_id,
            client_profiles!projects_client_id_fkey (
              client_id,
              full_name
            )
          `)
          .limit(1);
        
        if (clientJoinError) {
          console.log(`   ❌ Client relationship test failed: ${clientJoinError.message}`);
          console.log(`      This suggests projects.client_id doesn't properly reference client_profiles`);
        } else {
          console.log('   ✅ Client relationship works');
        }

        // Test freelancer relationship  
        const { data: freelancerJoin, error: freelancerJoinError } = await supabase
          .from('projects')
          .select(`
            id,
            freelancer_id,
            freelancer_profiles!projects_freelancer_id_fkey (
              freelancer_id,
              full_name
            )
          `)
          .limit(1);
        
        if (freelancerJoinError) {
          console.log(`   ❌ Freelancer relationship test failed: ${freelancerJoinError.message}`);
          console.log(`      This suggests projects.freelancer_id doesn't properly reference freelancer_profiles`);
        } else {
          console.log('   ✅ Freelancer relationship works');
        }
      } catch (err) {
        console.log(`   ❌ Relationship test error: ${err.message}`);
      }
    }

    // Check ID generation functions
    console.log('\n5️⃣ Testing ID generation functions...');
    
    try {
      const { data: clientId, error: clientIdError } = await supabase.rpc('generate_client_id');
      if (clientIdError) {
        console.log(`   ❌ generate_client_id function missing: ${clientIdError.message}`);
      } else {
        console.log(`   ✅ generate_client_id works: ${clientId}`);
      }
    } catch (err) {
      console.log(`   ❌ generate_client_id error: ${err.message}`);
    }

    try {
      const { data: freelancerId, error: freelancerIdError } = await supabase.rpc('generate_freelancer_id');
      if (freelancerIdError) {
        console.log(`   ❌ generate_freelancer_id function missing: ${freelancerIdError.message}`);
      } else {
        console.log(`   ✅ generate_freelancer_id works: ${freelancerId}`);
      }
    } catch (err) {
      console.log(`   ❌ generate_freelancer_id error: ${err.message}`);
    }

    // Check current data consistency
    console.log('\n6️⃣ Checking data consistency...');
    
    if (tableExistence.projects && tableExistence.client_profiles) {
      try {
        const { data: orphanProjects } = await supabase
          .from('projects')
          .select('id, client_id')
          .not('client_id', 'in', 
            supabase.from('client_profiles').select('client_id')
          )
          .limit(5);
        
        if (orphanProjects && orphanProjects.length > 0) {
          console.log(`   ⚠️  Found ${orphanProjects.length} projects with invalid client_id references`);
          orphanProjects.forEach(p => {
            console.log(`      - Project ${p.id} references non-existent client_id: ${p.client_id}`);
          });
        } else {
          console.log('   ✅ All projects have valid client_id references');
        }
      } catch (err) {
        console.log(`   ❌ Client consistency check failed: ${err.message}`);
      }
    }

    // Summary
    console.log('\n📊 DATABASE STATE SUMMARY');
    console.log('=========================');
    
    const existingTables = Object.entries(tableExistence)
      .filter(([table, exists]) => exists)
      .map(([table]) => table);
    
    console.log(`✅ Existing tables: ${existingTables.join(', ')}`);
    
    const missingTables = Object.entries(tableExistence)
      .filter(([table, exists]) => !exists)
      .map(([table]) => table);
    
    if (missingTables.length > 0) {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    }

    console.log('\n🚨 CRITICAL ISSUES TO ADDRESS:');
    console.log('1. Check foreign key relationships in projects table');
    console.log('2. Ensure ID generation functions are deployed');
    console.log('3. Verify data consistency before dual-role deployment');
    console.log('4. Test project creation functionality');

  } catch (error) {
    console.error('❌ Database state check failed:', error.message);
  }
}

// Run the check
checkDatabaseState();




