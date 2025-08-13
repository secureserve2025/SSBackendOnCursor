-- Test script to check freelancer_profiles table and RLS policies
-- Run this in Supabase SQL editor

-- 1. Check if freelancer_profiles table exists and has data
SELECT '=== CHECKING FREELANCER_PROFILES TABLE ===' as section;

SELECT 
    COUNT(*) as total_freelancers,
    COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_freelancers,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN account_status = 'active' AND profile_completed = true THEN 1 END) as active_completed_profiles
FROM freelancer_profiles;

-- 2. Show all freelancer profiles (if any exist)
SELECT '=== ALL FREELANCER PROFILES ===' as section;

SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed,
    created_at
FROM freelancer_profiles
ORDER BY created_at DESC;

-- 3. Check RLS policies
SELECT '=== RLS POLICIES FOR FREELANCER_PROFILES ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 4. Check if RLS is enabled on the table
SELECT '=== RLS STATUS ===' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'freelancer_profiles';

-- 5. Test the function directly
SELECT '=== TESTING FUNCTION ===' as section;

SELECT * FROM get_all_active_freelancer_ids();

-- 6. Check if there are any users in auth.users
SELECT '=== AUTH USERS ===' as section;

SELECT 
    id,
    email,
    created_at
FROM auth.users
LIMIT 5;

-- 7. Check if there are any client profiles
SELECT '=== CLIENT PROFILES ===' as section;

SELECT 
    client_id,
    full_name,
    email,
    created_at
FROM client_profiles
LIMIT 5; 