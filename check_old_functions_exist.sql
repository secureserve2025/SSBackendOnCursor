-- Check if old functions exist and what they look like

SELECT '=== CHECKING OLD FUNCTIONS ===' as section;

-- Check if handle_new_client exists
SELECT '=== handle_new_client EXISTS? ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_client'
AND routine_schema = 'public';

-- Check if handle_new_freelancer exists
SELECT '=== handle_new_freelancer EXISTS? ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_freelancer'
AND routine_schema = 'public';

-- If they exist, show their source code
SELECT '=== handle_new_client SOURCE (if exists) ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_client';

SELECT '=== handle_new_freelancer SOURCE (if exists) ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_freelancer';


