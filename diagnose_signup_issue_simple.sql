-- Simple Diagnostic Script for Signup Issues
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check if tables exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1) 
    THEN '✅ freelancer_profiles table exists' 
    ELSE '❌ freelancer_profiles table missing' 
  END as freelancer_table_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM client_profiles LIMIT 1) 
    THEN '✅ client_profiles table exists' 
    ELSE '❌ client_profiles table missing' 
  END as client_table_status;

-- 2. Check if triggers exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_freelancer') 
    THEN '✅ freelancer trigger exists' 
    ELSE '❌ freelancer trigger missing' 
  END as freelancer_trigger_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_client') 
    THEN '✅ client trigger exists' 
    ELSE '❌ client trigger missing' 
  END as client_trigger_status;

-- 3. Check if functions exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_freelancer') 
    THEN '✅ freelancer function exists' 
    ELSE '❌ freelancer function missing' 
  END as freelancer_function_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_client') 
    THEN '✅ client function exists' 
    ELSE '❌ client function missing' 
  END as client_function_status;

-- 4. Check RLS policies
SELECT 
  COUNT(*) as freelancer_policy_count
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

SELECT 
  COUNT(*) as client_policy_count
FROM pg_policies 
WHERE tablename = 'client_profiles';

-- 5. Check recent signups (if any)
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'user_type' = 'freelancer' THEN 1 END) as freelancer_users,
  COUNT(CASE WHEN raw_user_meta_data->>'user_type' = 'client' THEN 1 END) as client_users
FROM auth.users;

-- 6. Check if profiles exist for users
SELECT 
  COUNT(*) as total_profiles,
  (SELECT COUNT(*) FROM freelancer_profiles) as freelancer_profiles,
  (SELECT COUNT(*) FROM client_profiles) as client_profiles;
