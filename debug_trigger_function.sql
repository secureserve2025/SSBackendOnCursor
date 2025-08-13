-- Debug Trigger Function
-- This script checks the trigger function and tests it

-- 1. Check if the function exists and its definition
SELECT '=== FUNCTION DEFINITION ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'safe_handle_new_user_signup'
AND routine_schema = 'public';

-- 2. Check if there are any syntax errors in the function
SELECT '=== FUNCTION STATUS ===' as section;
SELECT 
    proname,
    prosrc,
    proconfig
FROM pg_proc 
WHERE proname = 'safe_handle_new_user_signup';

-- 3. Check if the tables exist and have the right structure
SELECT '=== TABLE STRUCTURE CHECK ===' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('client_profiles', 'freelancer_profiles')
AND column_name IN ('user_id', 'email', 'full_name', 'mobile_number', 'created_at', 'updated_at')
ORDER BY table_name, column_name;

-- 4. Check if there are any constraints that might be failing
SELECT '=== CONSTRAINT CHECK ===' as section;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('client_profiles', 'freelancer_profiles')
ORDER BY tc.table_name, tc.constraint_type;

-- 5. Test the function manually to see if it works
SELECT '=== MANUAL FUNCTION TEST ===' as section;

-- Create a test user record to simulate what the trigger would receive
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_result TEXT;
BEGIN
    -- Test the function with a freelancer user
    BEGIN
        -- Simulate what the trigger would do
        PERFORM safe_handle_new_user_signup();
        
        -- If we get here, the function executed without error
        RAISE NOTICE 'Function executed successfully';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function error: %', SQLERRM;
    END;
END $$;

-- 6. Check the PostgreSQL logs for any errors
SELECT '=== LOG CHECK ===' as section;
SELECT 'Check Supabase logs for any trigger errors' as note;

-- 7. Let's try a simpler approach - disable RLS temporarily to test
SELECT '=== RLS DISABLE TEST ===' as section;
-- Temporarily disable RLS to see if that's the issue
ALTER TABLE client_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;

-- 8. Test the trigger again
SELECT '=== TRIGGER TEST WITH RLS DISABLED ===' as section;
SELECT 'RLS disabled - try signup again' as instruction;

-- 9. Re-enable RLS after testing
SELECT '=== RE-ENABLE RLS ===' as section;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;

-- 10. Check if there are any foreign key constraints that might be failing
SELECT '=== FOREIGN KEY CHECK ===' as section;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('client_profiles', 'freelancer_profiles');


