// Database State Validation Script
// Run with: node validate-database-state.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log('🔍 Database State Validation');
console.log('============================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runValidation() {
  // Declare variables at function scope
  let clientProfiles = null;
  let freelancerProfiles = null;
  let projects = null;
  
  try {
    console.log('1️⃣ Checking table existence...');
    
    // Check if tables exist by trying to query them
    const tableChecks = [
      'client_profiles',
      'freelancer_profiles', 
      'projects',
      'project_files',
      'deliverables',
      'work_products',
      'transactions',
      'messages'
    ];

    const tableStatus = {};
    
    for (const table of tableChecks) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        tableStatus[table] = error ? 'ERROR: ' + error.message : 'EXISTS';
      } catch (err) {
        tableStatus[table] = 'MISSING';
      }
    }

    console.log('Table Status:');
    Object.entries(tableStatus).forEach(([table, status]) => {
      const icon = status === 'EXISTS' ? '✅' : status.includes('ERROR') ? '⚠️' : '❌';
      console.log(`   ${icon} ${table}: ${status}`);
    });
    console.log('');

    // Only proceed with detailed checks if profile tables exist
    if (tableStatus.client_profiles === 'EXISTS' && tableStatus.freelancer_profiles === 'EXISTS') {
      
      console.log('2️⃣ Checking profile data...');
      
      // Get client profiles data
      const { data: clientProfilesData, error: clientError } = await supabase
        .from('client_profiles')
        .select('client_id, email, full_name, created_at');
      
      clientProfiles = clientProfilesData;
      
      if (clientError) {
        console.log('   ❌ Error fetching client profiles:', clientError.message);
      } else {
        console.log(`   ✅ Client Profiles: ${clientProfiles.length} records found`);
        
        // Check client_id format
        const invalidClientIds = clientProfiles.filter(p => 
          !p.client_id || !/^C[0-9]{9}$/.test(p.client_id)
        );
        
        if (invalidClientIds.length > 0) {
          console.log(`   ⚠️  Invalid client IDs found: ${invalidClientIds.length}`);
          invalidClientIds.slice(0, 5).forEach(p => {
            console.log(`      - ${p.client_id} (${p.email})`);
          });
        } else {
          console.log('   ✅ All client IDs have valid format (C123456789)');
        }
        
        // Check for duplicate client_ids
        const clientIdCounts = {};
        clientProfiles.forEach(p => {
          clientIdCounts[p.client_id] = (clientIdCounts[p.client_id] || 0) + 1;
        });
        const duplicateClientIds = Object.entries(clientIdCounts).filter(([id, count]) => count > 1);
        
        if (duplicateClientIds.length > 0) {
          console.log(`   ⚠️  Duplicate client IDs found: ${duplicateClientIds.length}`);
          duplicateClientIds.forEach(([id, count]) => {
            console.log(`      - ${id}: appears ${count} times`);
          });
        } else {
          console.log('   ✅ All client IDs are unique');
        }
      }

      // Get freelancer profiles data
      const { data: freelancerProfilesData, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select('freelancer_id, email, full_name, created_at');
      
      freelancerProfiles = freelancerProfilesData;
      
      if (freelancerError) {
        console.log('   ❌ Error fetching freelancer profiles:', freelancerError.message);
      } else {
        console.log(`   ✅ Freelancer Profiles: ${freelancerProfiles.length} records found`);
        
        // Check freelancer_id format
        const invalidFreelancerIds = freelancerProfiles.filter(p => 
          !p.freelancer_id || !/^F[0-9]{9}$/.test(p.freelancer_id)
        );
        
        if (invalidFreelancerIds.length > 0) {
          console.log(`   ⚠️  Invalid freelancer IDs found: ${invalidFreelancerIds.length}`);
          invalidFreelancerIds.slice(0, 5).forEach(p => {
            console.log(`      - ${p.freelancer_id} (${p.email})`);
          });
        } else {
          console.log('   ✅ All freelancer IDs have valid format (F123456789)');
        }
        
        // Check for duplicate freelancer_ids
        const freelancerIdCounts = {};
        freelancerProfiles.forEach(p => {
          freelancerIdCounts[p.freelancer_id] = (freelancerIdCounts[p.freelancer_id] || 0) + 1;
        });
        const duplicateFreelancerIds = Object.entries(freelancerIdCounts).filter(([id, count]) => count > 1);
        
        if (duplicateFreelancerIds.length > 0) {
          console.log(`   ⚠️  Duplicate freelancer IDs found: ${duplicateFreelancerIds.length}`);
          duplicateFreelancerIds.forEach(([id, count]) => {
            console.log(`      - ${id}: appears ${count} times`);
          });
        } else {
          console.log('   ✅ All freelancer IDs are unique');
        }
      }

      console.log('');
      console.log('3️⃣ Checking dual role users...');
      
      // Find users with both client and freelancer profiles
      if (clientProfiles && freelancerProfiles) {
        const clientEmails = new Set(clientProfiles.map(p => p.email));
        const freelancerEmails = new Set(freelancerProfiles.map(p => p.email));
        
        const dualRoleEmails = [...clientEmails].filter(email => freelancerEmails.has(email));
        
        if (dualRoleEmails.length > 0) {
          console.log(`   ✅ Dual role users found: ${dualRoleEmails.length}`);
          dualRoleEmails.slice(0, 5).forEach(email => {
            const client = clientProfiles.find(p => p.email === email);
            const freelancer = freelancerProfiles.find(p => p.email === email);
            console.log(`      - ${email}: Client ID: ${client.client_id}, Freelancer ID: ${freelancer.freelancer_id}`);
          });
        } else {
          console.log('   ℹ️  No dual role users found');
        }
      }

    } else {
      console.log('⚠️  Profile tables not found or accessible. Skipping detailed validation.');
    }

    console.log('');
    console.log('4️⃣ Checking projects table...');
    
    if (tableStatus.projects === 'EXISTS') {
      // Get projects data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, project_id, client_id, freelancer_id, project_name, project_status')
        .limit(10);
      
      projects = projectsData;
      
      if (projectsError) {
        console.log('   ❌ Error fetching projects:', projectsError.message);
      } else {
        console.log(`   ✅ Projects: ${projects.length} records found (showing first 10)`);
        
        if (projects.length > 0) {
          console.log('   📋 Sample projects:');
          projects.slice(0, 3).forEach(p => {
            console.log(`      - ${p.project_id || p.id}: "${p.project_name}" | Client: ${p.client_id} | Freelancer: ${p.freelancer_id || 'None'}`);
          });
          
          // Check client_id references
          if (clientProfiles) {
            const validClientIds = new Set(clientProfiles.map(p => p.client_id));
            const invalidClientRefs = projects.filter(p => p.client_id && !validClientIds.has(p.client_id));
            
            if (invalidClientRefs.length > 0) {
              console.log(`   ⚠️  Projects with invalid client_id references: ${invalidClientRefs.length}`);
              invalidClientRefs.slice(0, 3).forEach(p => {
                console.log(`      - Project ${p.project_id || p.id}: client_id ${p.client_id} not found`);
              });
            } else {
              console.log('   ✅ All project client_id references are valid');
            }
          }
          
          // Check freelancer_id references
          if (freelancerProfiles) {
            const validFreelancerIds = new Set(freelancerProfiles.map(p => p.freelancer_id));
            const invalidFreelancerRefs = projects.filter(p => 
              p.freelancer_id && !validFreelancerIds.has(p.freelancer_id)
            );
            
            if (invalidFreelancerRefs.length > 0) {
              console.log(`   ⚠️  Projects with invalid freelancer_id references: ${invalidFreelancerRefs.length}`);
              invalidFreelancerRefs.slice(0, 3).forEach(p => {
                console.log(`      - Project ${p.project_id || p.id}: freelancer_id ${p.freelancer_id} not found`);
              });
            } else {
              console.log('   ✅ All project freelancer_id references are valid');
            }
          }
        }
      }
    } else {
      console.log('   ⚠️  Projects table not accessible');
    }

    console.log('');
    console.log('5️⃣ Testing immutability protection...');
    
    // Try to test if immutability triggers exist by checking database functions
    try {
      const { data, error } = await supabase.rpc('get_function_names');
      if (error) {
        console.log('   ⚠️  Cannot check database functions directly through Supabase client');
        console.log('   ℹ️  This is normal - immutability can only be tested with direct SQL access');
      }
    } catch (err) {
      console.log('   ⚠️  Cannot test immutability triggers through Supabase client');
      console.log('   ℹ️  Immutability protection requires database-level triggers');
    }

    console.log('');
    console.log('📊 SUMMARY REPORT');
    console.log('=================');
    
    const existingTables = Object.entries(tableStatus).filter(([table, status]) => status === 'EXISTS');
    const missingTables = Object.entries(tableStatus).filter(([table, status]) => status === 'MISSING');
    const errorTables = Object.entries(tableStatus).filter(([table, status]) => status.includes('ERROR'));
    
    console.log(`✅ Existing tables: ${existingTables.length}`);
    if (existingTables.length > 0) {
      console.log(`   ${existingTables.map(([table]) => table).join(', ')}`);
    }
    
    if (missingTables.length > 0) {
      console.log(`❌ Missing tables: ${missingTables.length}`);
      console.log(`   ${missingTables.map(([table]) => table).join(', ')}`);
    }
    
    if (errorTables.length > 0) {
      console.log(`⚠️  Tables with errors: ${errorTables.length}`);
      errorTables.forEach(([table, status]) => {
        console.log(`   ${table}: ${status}`);
      });
    }

    if (clientProfiles && freelancerProfiles) {
      console.log(`👥 Total unique users: ${new Set([...clientProfiles.map(p => p.email), ...freelancerProfiles.map(p => p.email)]).size}`);
      console.log(`👤 Client profiles: ${clientProfiles.length}`);
      console.log(`🛠  Freelancer profiles: ${freelancerProfiles.length}`);
      
      const dualRoleCount = [...new Set(clientProfiles.map(p => p.email))].filter(email => 
        freelancerProfiles.some(p => p.email === email)
      ).length;
      console.log(`🔄 Dual role users: ${dualRoleCount}`);
    }

    console.log('');
    console.log('🚨 CRITICAL ISSUES TO ADDRESS:');
    console.log('==============================');
    
    let criticalIssues = 0;
    
    if (missingTables.includes('client_profiles') || missingTables.includes('freelancer_profiles')) {
      criticalIssues++;
      console.log(`${criticalIssues}. Missing core profile tables - need to run schema setup`);
    }
    
    // Note: invalidClientIds and invalidFreelancerIds are defined within the profile checks scope
    let hasInvalidClientIds = false;
    let hasInvalidFreelancerIds = false;
    
    // We already checked these above, so we'll track if there were issues
    if (clientProfiles && clientProfiles.length > 0) {
      const invalidClientCheck = clientProfiles.filter(p => 
        !p.client_id || !/^C[0-9]{9}$/.test(p.client_id)
      );
      if (invalidClientCheck.length > 0) {
        hasInvalidClientIds = true;
        criticalIssues++;
        console.log(`${criticalIssues}. Invalid client ID formats found - need to fix ${invalidClientCheck.length} records`);
      }
    }
    
    if (freelancerProfiles && freelancerProfiles.length > 0) {
      const invalidFreelancerCheck = freelancerProfiles.filter(p => 
        !p.freelancer_id || !/^F[0-9]{9}$/.test(p.freelancer_id)
      );
      if (invalidFreelancerCheck.length > 0) {
        hasInvalidFreelancerIds = true;
        criticalIssues++;
        console.log(`${criticalIssues}. Invalid freelancer ID formats found - need to fix ${invalidFreelancerCheck.length} records`);
      }
    }
    
    criticalIssues++;
    console.log(`${criticalIssues}. No immutability protection detected - IDs can be modified`);
    
    if (tableStatus.projects !== 'EXISTS') {
      criticalIssues++;
      console.log(`${criticalIssues}. Projects table structure needs to be standardized`);
    }
    
    if (criticalIssues === 1) {
      console.log('');
      console.log('🎉 Overall system health: GOOD');
      console.log('   Only immutability protection needs to be added');
    } else {
      console.log('');
      console.log('⚠️  Overall system health: NEEDS ATTENTION');
      console.log(`   ${criticalIssues} critical issues need to be resolved`);
    }

    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. Apply the immutability fix script first');
    console.log('2. Then apply the schema consistency script if needed');
    console.log('3. Run this validation again to confirm fixes');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error('   Make sure your Supabase connection is working');
  }
}

// Run the validation
runValidation().then(() => {
  console.log('');
  console.log('✅ Validation complete!');
}).catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
