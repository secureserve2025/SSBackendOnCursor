-- Comprehensive Auth Diagnostic
-- This script checks all auth-related components step by step

-- 1. Check if all required functions exist
SELECT '=== FUNCTION CHECK ===' as section;
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'safe_handle_new_user_signup',
    'safe_generate_client_id', 
    'safe_generate_freelancer_id',
    'can_register_as_freelancer',
    'can_register_as_client',
    'check_email_usage',
    'is_valid_email_format'
)
ORDER BY routine_name;

-- 2. Check if the auth trigger exists
SELECT '=== AUTH TRIGGER CHECK ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    CASE 
        WHEN trigger_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- 3. Check all triggers on auth.users
SELECT '=== ALL AUTH TRIGGERS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- 4. Test ID generation functions
SELECT '=== ID GENERATION TEST ===' as section;
SELECT 'safe_generate_client_id' as function_name, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'safe_generate_client_id') 
           THEN safe_generate_client_id()
           ELSE 'FUNCTION MISSING'
       END as result;

SELECT 'safe_generate_freelancer_id' as function_name, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'safe_generate_freelancer_id') 
           THEN safe_generate_freelancer_id()
           ELSE 'FUNCTION MISSING'
       END as result;

-- 5. Check RLS policies
SELECT '=== RLS POLICIES CHECK ===' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN policyname IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
ORDER BY tablename, policyname;

-- 6. Check RLS status on tables
SELECT '=== RLS STATUS ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('client_profiles', 'freelancer_profiles');

-- 7. Test email registration functions
SELECT '=== EMAIL REGISTRATION TEST ===' as section;
SELECT 'can_register_as_freelancer' as function_name,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_register_as_freelancer') 
           THEN 'FUNCTION EXISTS'
           ELSE 'FUNCTION MISSING'
       END as status;

SELECT 'can_register_as_client' as function_name,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_register_as_client') 
           THEN 'FUNCTION EXISTS'
           ELSE 'FUNCTION MISSING'
       END as status;

-- 8. Check table structure
SELECT '=== TABLE STRUCTURE ===' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('client_profiles', 'freelancer_profiles')
AND column_name IN ('user_id', 'email', 'created_at')
ORDER BY table_name, column_name;

-- 9. Check for any existing users without profiles
SELECT '=== ORPHANED USERS CHECK ===' as section;
SELECT 
    'auth.users without client_profiles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN client_profiles c ON u.id = c.user_id
WHERE c.user_id IS NULL
AND u.raw_user_meta_data->>'user_type' = 'client'

UNION ALL

SELECT 
    'auth.users without freelancer_profiles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN freelancer_profiles f ON u.id = f.user_id
WHERE f.user_id IS NULL
AND u.raw_user_meta_data->>'user_type' = 'freelancer';


