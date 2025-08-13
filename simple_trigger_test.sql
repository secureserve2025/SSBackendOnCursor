-- Simple Trigger Test
-- This script tests the trigger function directly

-- 1. First, let's see what the function looks like
SELECT '=== FUNCTION SOURCE ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'safe_handle_new_user_signup';

-- 2. Test if the function can be called (this will show any syntax errors)
SELECT '=== FUNCTION CALL TEST ===' as section;

-- Try to call the function with a dummy NEW record
DO $$
DECLARE
    dummy_new RECORD;
BEGIN
    -- Create a dummy NEW record like what the trigger would receive
    dummy_new.id := gen_random_uuid();
    dummy_new.email := 'test@example.com';
    dummy_new.raw_user_meta_data := '{"user_type": "freelancer", "full_name": "Test User"}'::jsonb;
    
    -- Try to call the function
    BEGIN
        PERFORM safe_handle_new_user_signup();
        RAISE NOTICE 'Function called successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function error: %', SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLSTATE;
    END;
END $$;

-- 3. Check if the tables are accessible
SELECT '=== TABLE ACCESS TEST ===' as section;
SELECT COUNT(*) as client_profiles_count FROM client_profiles;
SELECT COUNT(*) as freelancer_profiles_count FROM freelancer_profiles;

-- 4. Test a simple insert to see if RLS is blocking
SELECT '=== SIMPLE INSERT TEST ===' as section;
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    BEGIN
        INSERT INTO freelancer_profiles (
            user_id, freelancer_id, email, full_name, 
            mobile_number, created_at, updated_at
        ) VALUES (
            test_user_id, 
            'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
            'test@example.com',
            'Test User',
            '0000000000',
            NOW() AT TIME ZONE 'Asia/Kolkata',
            NOW() AT TIME ZONE 'Asia/Kolkata'
        );
        RAISE NOTICE 'Simple insert successful';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Simple insert failed: %', SQLERRM;
    END;
END $$;

-- 5. Check if there are any unique constraints that might be failing
SELECT '=== UNIQUE CONSTRAINT CHECK ===' as section;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_name IN ('client_profiles', 'freelancer_profiles');

-- 6. Check if the email already exists (this might be the issue)
SELECT '=== EMAIL EXISTENCE CHECK ===' as section;
SELECT 'ktforever123@gmail.com' as email_to_check,
       CASE 
           WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'ktforever123@gmail.com') 
           THEN 'EXISTS in auth.users'
           ELSE 'NOT EXISTS in auth.users'
       END as auth_users_status,
       CASE 
           WHEN EXISTS (SELECT 1 FROM client_profiles WHERE email = 'ktforever123@gmail.com') 
           THEN 'EXISTS in client_profiles'
           ELSE 'NOT EXISTS in client_profiles'
       END as client_profiles_status,
       CASE 
           WHEN EXISTS (SELECT 1 FROM freelancer_profiles WHERE email = 'ktforever123@gmail.com') 
           THEN 'EXISTS in freelancer_profiles'
           ELSE 'NOT EXISTS in freelancer_profiles'
       END as freelancer_profiles_status;


