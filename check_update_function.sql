-- Check the update_updated_at_column function
-- This will show us what's causing the timezone issue

SELECT '=== UPDATE_UPDATED_AT_COLUMN FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'update_updated_at_column';

-- Check if the trigger exists
SELECT '=== UPDATED_AT TRIGGER ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_freelancer_profiles_updated_at'
AND event_object_table = 'freelancer_profiles';


