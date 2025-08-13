-- Check the source code of old trigger functions
-- This will show us if they have the same issues as the new function

SELECT '=== OLD TRIGGER FUNCTIONS SOURCE CODE ===' as section;

-- Check handle_new_client function source
SELECT '=== handle_new_client SOURCE ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_client';

-- Check handle_new_freelancer function source
SELECT '=== handle_new_freelancer SOURCE ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_freelancer';

-- Check if they call the same missing functions
SELECT '=== FUNCTION CALL ANALYSIS ===' as section;
SELECT 
    'handle_new_client calls safe_generate_client_id: ' || 
    CASE 
        WHEN prosrc LIKE '%safe_generate_client_id%' THEN 'YES'
        ELSE 'NO'
    END as client_function_check
FROM pg_proc WHERE proname = 'handle_new_client';

SELECT 
    'handle_new_freelancer calls safe_generate_freelancer_id: ' || 
    CASE 
        WHEN prosrc LIKE '%safe_generate_freelancer_id%' THEN 'YES'
        ELSE 'NO'
    END as freelancer_function_check
FROM pg_proc WHERE proname = 'handle_new_freelancer';


