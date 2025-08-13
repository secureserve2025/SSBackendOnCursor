-- Step 4: Test metadata access
-- This tests how the trigger function would access user metadata

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
