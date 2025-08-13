// Detailed Schema Analysis
// This script examines the actual deployed database schema
// Run with: node detailed_schema_analysis.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function analyzeSchema() {
  console.log('🔍 DETAILED DATABASE SCHEMA ANALYSIS');
  console.log('====================================\n');

  try {
    // 1. Check table structure
    console.log('1️⃣ TABLE STRUCTURE ANALYSIS');
    console.log('---------------------------');
    
    // Check projects table structure
    const { data: projectsInfo, error: projectsInfoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'projects')
      .order('ordinal_position');
    
    if (projectsInfoError) {
      console.log('   ❌ Could not get projects table info:', projectsInfoError.message);
    } else {
      console.log('   📊 Projects Table Structure:');
      projectsInfo.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      });
    }

    // Check profile table structures
    const { data: clientProfilesInfo } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'client_profiles')
      .order('ordinal_position');
    
    console.log('\n   📊 Client Profiles Table Structure:');
    if (clientProfilesInfo) {
      clientProfilesInfo.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      });
    }

    const { data: freelancerProfilesInfo } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'freelancer_profiles')
      .order('ordinal_position');
    
    console.log('\n   📊 Freelancer Profiles Table Structure:');
    if (freelancerProfilesInfo) {
      freelancerProfilesInfo.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      });
    }

    // 2. Check foreign key constraints
    console.log('\n\n2️⃣ FOREIGN KEY CONSTRAINTS ANALYSIS');
    console.log('-----------------------------------');
    
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_name,
        constraint_type
      `)
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (fkError) {
      console.log('   ❌ Could not get foreign key info:', fkError.message);
    } else {
      console.log('   🔗 Foreign Key Constraints:');
      foreignKeys.forEach(fk => {
        console.log(`      - ${fk.table_name}: ${fk.constraint_name}`);
      });
    }

    // Get detailed foreign key relationships
    const { data: fkDetails } = await supabase
      .from('information_schema.referential_constraints')
      .select(`
        constraint_name,
        unique_constraint_name
      `);
    
    if (fkDetails) {
      console.log('\n   🔗 Foreign Key Details:');
      fkDetails.forEach(fk => {
        console.log(`      - ${fk.constraint_name} → ${fk.unique_constraint_name}`);
      });
    }

    // 3. Check indexes
    console.log('\n\n3️⃣ INDEX ANALYSIS');
    console.log('-----------------');
    
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .in('tablename', ['projects', 'client_profiles', 'freelancer_profiles']);
    
    if (indexes) {
      console.log('   📇 Database Indexes:');
      indexes.forEach(idx => {
        console.log(`      - ${idx.tablename}.${idx.indexname}`);
        console.log(`        ${idx.indexdef}`);
      });
    }

    // 4. Check triggers and functions
    console.log('\n\n4️⃣ TRIGGERS AND FUNCTIONS ANALYSIS');
    console.log('----------------------------------');
    
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, action_timing, event_manipulation')
      .in('event_object_table', ['auth.users', 'client_profiles', 'freelancer_profiles', 'projects']);
    
    if (triggers) {
      console.log('   ⚡ Database Triggers:');
      triggers.forEach(trigger => {
        console.log(`      - ${trigger.trigger_name} ON ${trigger.event_object_table}`);
        console.log(`        ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
    }

    const { data: functions } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_type', 'FUNCTION')
      .like('routine_name', '%client%,%freelancer%,%project%,%generate%');
    
    if (functions) {
      console.log('\n   🔧 Related Functions:');
      functions.forEach(func => {
        console.log(`      - ${func.routine_name} (${func.routine_type})`);
      });
    }

    // 5. Test current data patterns
    console.log('\n\n5️⃣ CURRENT DATA PATTERNS ANALYSIS');
    console.log('---------------------------------');
    
    // Check if there are any existing projects
    const { data: sampleProjects } = await supabase
      .from('projects')
      .select('id, client_id, freelancer_id')
      .limit(3);
    
    if (sampleProjects && sampleProjects.length > 0) {
      console.log('   📋 Sample Project Data Patterns:');
      sampleProjects.forEach((project, idx) => {
        console.log(`      Project ${idx + 1}:`);
        console.log(`        - id: ${project.id} (${typeof project.id})`);
        console.log(`        - client_id: ${project.client_id} (${typeof project.client_id})`);
        console.log(`        - freelancer_id: ${project.freelancer_id} (${typeof project.freelancer_id})`);
      });
    } else {
      console.log('   ℹ️  No projects found to analyze patterns');
    }

    // Check profile ID patterns
    const { data: sampleClients } = await supabase
      .from('client_profiles')
      .select('id, user_id, client_id')
      .limit(3);
    
    if (sampleClients && sampleClients.length > 0) {
      console.log('\n   👤 Sample Client Profile Patterns:');
      sampleClients.forEach((client, idx) => {
        console.log(`      Client ${idx + 1}:`);
        console.log(`        - id: ${client.id} (${typeof client.id})`);
        console.log(`        - user_id: ${client.user_id} (${typeof client.user_id})`);
        console.log(`        - client_id: ${client.client_id} (${typeof client.client_id})`);
      });
    }

    const { data: sampleFreelancers } = await supabase
      .from('freelancer_profiles')
      .select('id, user_id, freelancer_id')
      .limit(3);
    
    if (sampleFreelancers && sampleFreelancers.length > 0) {
      console.log('\n   🎯 Sample Freelancer Profile Patterns:');
      sampleFreelancers.forEach((freelancer, idx) => {
        console.log(`      Freelancer ${idx + 1}:`);
        console.log(`        - id: ${freelancer.id} (${typeof freelancer.id})`);
        console.log(`        - user_id: ${freelancer.user_id} (${typeof freelancer.user_id})`);
        console.log(`        - freelancer_id: ${freelancer.freelancer_id} (${typeof freelancer.freelancer_id})`);
      });
    }

    // 6. Check email uniqueness across tables
    console.log('\n\n6️⃣ EMAIL USAGE ANALYSIS');
    console.log('-----------------------');
    
    const { data: clientEmails } = await supabase
      .from('client_profiles')
      .select('email')
      .limit(5);
    
    const { data: freelancerEmails } = await supabase
      .from('freelancer_profiles')
      .select('email')
      .limit(5);
    
    if (clientEmails && freelancerEmails) {
      const allEmails = [...(clientEmails.map(c => c.email)), ...(freelancerEmails.map(f => f.email))];
      const duplicateEmails = allEmails.filter((email, index) => allEmails.indexOf(email) !== index);
      
      console.log(`   📧 Total client emails: ${clientEmails.length}`);
      console.log(`   📧 Total freelancer emails: ${freelancerEmails.length}`);
      console.log(`   ⚠️  Duplicate emails: ${duplicateEmails.length}`);
      
      if (duplicateEmails.length > 0) {
        console.log('   🚨 DUPLICATE EMAILS FOUND:');
        duplicateEmails.forEach(email => {
          console.log(`      - ${email}`);
        });
      }
    }

    console.log('\n\n📊 SCHEMA ANALYSIS SUMMARY');
    console.log('==========================');
    console.log('✅ Table structure examined');
    console.log('✅ Foreign key constraints checked');
    console.log('✅ Indexes analyzed');
    console.log('✅ Triggers and functions identified');
    console.log('✅ Data patterns analyzed');
    console.log('✅ Email usage checked');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review the structure analysis above');
    console.log('2. Identify which schema definition is actually deployed');
    console.log('3. Plan standardization approach based on findings');

  } catch (error) {
    console.error('❌ Schema analysis failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check Supabase environment variables');
    console.log('2. Ensure database is accessible');
    console.log('3. Verify permissions for schema inspection');
  }
}

// Run the analysis
analyzeSchema();




