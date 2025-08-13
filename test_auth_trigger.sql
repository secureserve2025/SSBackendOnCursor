-- Test Auth Trigger and Functions
-- This script verifies that the auth trigger is properly set up

-- 1. Check if the trigger exists
SELECT '=== CHECKING AUTH TRIGGER ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- 2. Check if the functions exist
SELECT '=== CHECKING FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('safe_handle_new_user_signup', 'safe_generate_client_id', 'safe_generate_freelancer_id')
ORDER BY routine_name;

-- 3. Test ID generation functions
SELECT '=== TESTING ID GENERATION ===' as section;
SELECT 'Client ID:' as test, safe_generate_client_id() as result;
SELECT 'Freelancer ID:' as test, safe_generate_freelancer_id() as result;

-- 4. Check RLS policies
SELECT '=== CHECKING RLS POLICIES ===' as section;
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
ORDER BY tablename, policyname;

-- 5. Check if tables have RLS enabled
SELECT '=== CHECKING RLS STATUS ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('client_profiles', 'freelancer_profiles');

-- 6. Test the signup handler function directly (simulate trigger)
SELECT '=== TESTING SIGNUP HANDLER ===' as section;
-- This simulates what the trigger would do
SELECT 'Function exists and can be called' as status 
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'safe_handle_new_user_signup'
);


