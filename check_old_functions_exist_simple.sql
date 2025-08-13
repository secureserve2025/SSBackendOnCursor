-- Check if old functions exist
-- This will show us if the old functions are actually there

SELECT '=== CHECKING IF OLD FUNCTIONS EXIST ===' as section;

-- Check if handle_new_client exists
SELECT 
    'handle_new_client exists: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_client') THEN 'YES'
        ELSE 'NO'
    END as client_function_exists;

-- Check if handle_new_freelancer exists
SELECT 
    'handle_new_freelancer exists: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_freelancer') THEN 'YES'
        ELSE 'NO'
    END as freelancer_function_exists;

-- List all trigger functions
SELECT '=== ALL TRIGGER FUNCTIONS ===' as section;
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname LIKE '%client%' OR proname LIKE '%freelancer%' OR proname LIKE '%signup%'
ORDER BY proname;


