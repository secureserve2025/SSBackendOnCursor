-- Step 5: Test if trigger function can be called manually
-- This tests if the trigger function has syntax errors

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
