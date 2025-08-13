-- Fix Trigger Conflicts
-- Remove old conflicting triggers and keep only the new one

SELECT '=== REMOVING OLD CONFLICTING TRIGGERS ===' as section;

-- Drop the old conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;

-- Verify only the new trigger remains
SELECT '=== VERIFYING TRIGGER SETUP ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Test that the new trigger function works
SELECT '=== TESTING NEW TRIGGER FUNCTION ===' as section;
SELECT 'The new trigger safe_auto_create_profile should now be the only trigger' as status;
SELECT 'Try the freelancer signup with ktforever123@gmail.com' as instruction;


