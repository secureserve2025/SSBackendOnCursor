-- =============================================================================
-- BASIC DATABASE CHECK
-- =============================================================================
-- Simple script to check what tables exist in your database
-- =============================================================================

-- Check what tables exist in public schema
SELECT 'EXISTING TABLES IN PUBLIC SCHEMA' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if client_profiles table exists
SELECT 'CLIENT_PROFILES TABLE CHECK' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as status;

-- Check if freelancer_profiles table exists
SELECT 'FREELANCER_PROFILES TABLE CHECK' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as status;

-- Check if projects table exists
SELECT 'PROJECTS TABLE CHECK' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as status;

-- Check if auth.users table is accessible
SELECT 'AUTH.USERS TABLE CHECK' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as status;

-- Try to count records in client_profiles (if it exists)
SELECT 'CLIENT_PROFILES RECORD COUNT' as info;
SELECT COUNT(*) as record_count FROM client_profiles;

-- Try to count records in freelancer_profiles (if it exists)
SELECT 'FREELANCER_PROFILES RECORD COUNT' as info;
SELECT COUNT(*) as record_count FROM freelancer_profiles;

-- Try to count records in auth.users (if accessible)
SELECT 'AUTH.USERS RECORD COUNT' as info;
SELECT COUNT(*) as record_count FROM auth.users;

-- Check for target emails in client_profiles
SELECT 'TARGET EMAILS IN CLIENT_PROFILES' as info;
SELECT email, COUNT(*) as count 
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
GROUP BY email;

-- Check for target emails in freelancer_profiles
SELECT 'TARGET EMAILS IN FREELANCER_PROFILES' as info;
SELECT email, COUNT(*) as count 
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
GROUP BY email;

-- Check for target emails in auth.users
SELECT 'TARGET EMAILS IN AUTH.USERS' as info;
SELECT email, COUNT(*) as count 
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
GROUP BY email;
