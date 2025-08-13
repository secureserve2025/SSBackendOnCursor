-- Temporarily disable new trigger and test old triggers
-- This will help us see if the old triggers work properly

SELECT '=== TEMPORARILY DISABLING NEW TRIGGER ===' as section;

-- Disable the new trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER safe_auto_create_profile;

-- Verify the trigger is disabled
SELECT '=== VERIFYING TRIGGER STATUS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Show all active triggers on auth.users
SELECT '=== ACTIVE TRIGGERS ON AUTH.USERS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;

SELECT '=== TEST INSTRUCTIONS ===' as section;
SELECT 'Now try the freelancer signup with ktforever123@gmail.com' as instruction;
SELECT 'This will test if the old triggers work without the new one interfering' as note;


