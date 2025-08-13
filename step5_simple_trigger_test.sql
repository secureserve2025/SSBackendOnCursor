-- Step 5: Simple trigger function test
-- This tests if the trigger function exists and can be called

SELECT '=== SIMPLE TRIGGER FUNCTION TEST ===' as section;

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'safe_handle_new_user_signup'
AND routine_schema = 'public';

-- Test if we can call the function with a simple SELECT
SELECT 'Testing function call...' as test_status;

-- Try to call the function (this will show any errors)
SELECT safe_handle_new_user_signup();


