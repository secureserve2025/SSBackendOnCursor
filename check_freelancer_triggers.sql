-- Check what triggers exist on freelancer_profiles table
-- This will show us what triggers are currently active

SELECT '=== ALL TRIGGERS ON FREELANCER_PROFILES ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'freelancer_profiles'
ORDER BY trigger_name;

-- Check if update_updated_at_column function exists
SELECT '=== UPDATE_UPDATED_AT_COLUMN FUNCTION EXISTS? ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column'
AND routine_schema = 'public';

-- If it exists, show its source
SELECT '=== UPDATE_UPDATED_AT_COLUMN FUNCTION SOURCE ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'update_updated_at_column';


