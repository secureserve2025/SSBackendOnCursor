-- Check the updated_at trigger function
-- This will show us what's causing the timezone issue

SELECT '=== CHECKING UPDATED_AT TRIGGER ===' as section;

-- Check if the updated_at trigger function exists
SELECT '=== UPDATED_AT FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'update_updated_at_column';

-- Check if the trigger exists on freelancer_profiles
SELECT '=== UPDATED_AT TRIGGER ON FREELANCER_PROFILES ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_freelancer_profiles_updated_at'
AND event_object_table = 'freelancer_profiles';

-- Check current timezone settings
SELECT '=== TIMEZONE CHECK ===' as section;
SELECT 
    'Current timezone: ' || current_setting('timezone') as timezone_setting,
    'Current timestamp: ' || NOW() as current_timestamp,
    'Current timestamp with timezone: ' || NOW() AT TIME ZONE 'UTC' as utc_timestamp,
    'Current timestamp IST: ' || NOW() AT TIME ZONE 'Asia/Kolkata' as ist_timestamp;


