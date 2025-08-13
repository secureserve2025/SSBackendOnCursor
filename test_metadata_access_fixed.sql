-- Test Metadata Access (Fixed)
-- This script tests how the trigger function accesses user metadata

-- 1. Check what the current trigger function looks like
SELECT '=== CURRENT TRIGGER FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'safe_handle_new_user_signup';

-- 2. Check what columns actually exist in auth.users
SELECT '=== AUTH.USERS COLUMNS ===' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY column_name;

-- 3. Check if there are any existing users with metadata
SELECT '=== EXISTING USERS WITH METADATA ===' as section;
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Test how metadata is accessed
SELECT '=== METADATA ACCESS TEST ===' as section;
DO $$
DECLARE
    test_user RECORD;
    user_type_from_raw TEXT;
BEGIN
    -- Get the most recent user
    SELECT * INTO test_user FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF test_user.id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user: %', test_user.email;
        RAISE NOTICE 'raw_user_meta_data: %', test_user.raw_user_meta_data;
        
        -- Test accessing user_type from raw_user_meta_data
        user_type_from_raw := test_user.raw_user_meta_data->>'user_type';
        RAISE NOTICE 'user_type from raw_user_meta_data: %', user_type_from_raw;
        
        -- Test if the metadata is null or empty
        IF test_user.raw_user_meta_data IS NULL THEN
            RAISE NOTICE 'raw_user_meta_data is NULL';
        ELSIF test_user.raw_user_meta_data = '{}'::jsonb THEN
            RAISE NOTICE 'raw_user_meta_data is empty JSON object';
        ELSE
            RAISE NOTICE 'raw_user_meta_data has content';
        END IF;
    ELSE
        RAISE NOTICE 'No users found to test with';
    END IF;
END $$;

-- 5. Check if the trigger function can be called manually
SELECT '=== MANUAL TRIGGER TEST ===' as section;
DO $$
DECLARE
    test_result TEXT;
BEGIN
    BEGIN
        -- Try to call the function directly
        PERFORM safe_handle_new_user_signup();
        RAISE NOTICE 'Function called successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;

-- 6. Check if the tables have the right structure for the trigger
SELECT '=== TABLE STRUCTURE FOR TRIGGER ===' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('client_profiles', 'freelancer_profiles')
AND column_name IN ('user_id', 'email', 'full_name', 'mobile_number', 'created_at', 'updated_at')
ORDER BY table_name, column_name;

-- 7. Test a simple insert to see if the issue is with the trigger or the table
SELECT '=== SIMPLE INSERT TEST ===' as section;
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com';
BEGIN
    BEGIN
        INSERT INTO freelancer_profiles (
            user_id, 
            freelancer_id, 
            email, 
            full_name, 
            mobile_number, 
            created_at, 
            updated_at
        ) VALUES (
            test_user_id,
            'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
            test_email,
            'Test User',
            '0000000000',
            NOW() AT TIME ZONE 'Asia/Kolkata',
            NOW() AT TIME ZONE 'Asia/Kolkata'
        );
        RAISE NOTICE 'Simple insert successful with email: %', test_email;
        
        -- Clean up
        DELETE FROM freelancer_profiles WHERE email = test_email;
        RAISE NOTICE 'Test data cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Simple insert failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;

-- 8. Check if there are any unique constraints that might be causing issues
SELECT '=== UNIQUE CONSTRAINT CHECK ===' as section;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_name IN ('client_profiles', 'freelancer_profiles')
ORDER BY tc.table_name, tc.constraint_name;

-- 9. Check if the email ktforever123@gmail.com already exists
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


