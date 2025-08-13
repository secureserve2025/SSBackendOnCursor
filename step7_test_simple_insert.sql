-- Step 7: Test simple insert
-- This tests if basic inserts work (to isolate if it's a trigger issue or table issue)

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
