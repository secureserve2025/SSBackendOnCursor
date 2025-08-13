-- Step 6: Check trigger setup
-- This checks if the trigger exists and is set up correctly

SELECT '=== TRIGGER SETUP CHECK ===' as section;

-- Check if the trigger exists on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Check all triggers on auth.users
SELECT '=== ALL TRIGGERS ON AUTH.USERS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;


