-- Step 7: Check conflicting trigger functions
-- This checks what the other trigger functions look like

SELECT '=== CONFLICTING TRIGGER FUNCTIONS ===' as section;

-- Check handle_new_client function
SELECT '=== handle_new_client FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_client';

-- Check handle_new_freelancer function  
SELECT '=== handle_new_freelancer FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_freelancer';

-- Check if these functions exist
SELECT '=== FUNCTION EXISTENCE CHECK ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_client', 'handle_new_freelancer', 'safe_handle_new_user_signup')
AND routine_schema = 'public'
ORDER BY routine_name;


