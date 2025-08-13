-- Comprehensive diagnostic and fix for notifications function
-- The issue is likely a mismatch between user ID types

-- 1. Check the current data structure
SELECT '=== CURRENT DATA STRUCTURE ANALYSIS ===' as info;

-- Check projects table structure
SELECT '=== PROJECTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN ('id', 'client_id', 'freelancer_id')
ORDER BY ordinal_position;

-- 2. Check client_profiles table structure
SELECT '=== CLIENT_PROFILES TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'client_profiles' 
AND table_schema = 'public'
AND column_name IN ('id', 'user_id', 'client_id')
ORDER BY ordinal_position;

-- 3. Check sample data to understand the relationship
SELECT '=== SAMPLE PROJECTS DATA ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  client_id,
  freelancer_id,
  project_status_workflow,
  created_at
FROM projects 
WHERE project_status_workflow IN ('Under Manual Revision', 'AI Verified')
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check sample client_profiles data
SELECT '=== SAMPLE CLIENT_PROFILES DATA ===' as info;
SELECT 
  id,
  user_id,
  client_id,
  full_name,
  email
FROM client_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check the relationship between projects and client_profiles
SELECT '=== PROJECTS WITH CLIENT PROFILES ===' as info;
SELECT 
  p.id as project_id,
  p.project_id as project_display_id,
  p.client_id as project_client_id,
  p.project_status_workflow,
  cp.id as client_profile_id,
  cp.user_id as client_user_id,
  cp.client_id as client_profile_client_id,
  cp.full_name
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.client_id
WHERE p.project_status_workflow IN ('Under Manual Revision', 'AI Verified')
ORDER BY p.created_at DESC;

-- 6. Test the exact query that should work
SELECT '=== TESTING CORRECT QUERY ===' as info;
SELECT 'The correct query should join client_profiles to get the user_id' as note;

-- This shows what the function should actually do:
-- 1. Get the client_profile using user_id (UUID)
-- 2. Get the client_id (VARCHAR) from the profile
-- 3. Use that client_id to find projects
