-- Test Metadata Access
-- This script tests how the trigger function accesses user metadata

-- 1. Check what the current trigger function looks like
SELECT '=== CURRENT TRIGGER FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'safe_handle_new_user_signup';

-- 2. Check if there are any existing users with metadata
SELECT '=== EXISTING USERS WITH METADATA ===' as section;
SELECT 
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Test how metadata is accessed in different ways
SELECT '=== METADATA ACCESS TEST ===' as section;
DO $$
DECLARE
    test_user RECORD;
    user_type_from_raw TEXT;
    user_type_from_user TEXT;
BEGIN
    -- Get the most recent user
    SELECT * INTO test_user FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF test_user.id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user: %', test_user.email;
        RAISE NOTICE 'raw_user_meta_data: %', test_user.raw_user_meta_data;
        RAISE NOTICE 'user_metadata: %', test_user.user_metadata;
        
        -- Test accessing user_type from raw_user_meta_data
        user_type_from_raw := test_user.raw_user_meta_data->>'user_type';
        RAISE NOTICE 'user_type from raw_user_meta_data: %', user_type_from_raw;
        
        -- Test accessing user_type from user_metadata
        user_type_from_user := test_user.user_metadata->>'user_type';
        RAISE NOTICE 'user_type from user_metadata: %', user_type_from_user;
    ELSE
        RAISE NOTICE 'No users found to test with';
    END IF;
END $$;

-- 4. Check if the trigger function can be called manually
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

-- 5. Check if the tables have the right structure for the trigger
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

-- 6. Test a simple insert to see if the issue is with the trigger or the table
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

-- 7. Check if there are any unique constraints that might be causing issues
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


