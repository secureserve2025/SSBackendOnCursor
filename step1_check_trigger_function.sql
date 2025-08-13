-- Step 1: Check the current trigger function
-- This shows us what the trigger function looks like and if it has syntax errors

SELECT '=== CURRENT TRIGGER FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'safe_handle_new_user_signup';


