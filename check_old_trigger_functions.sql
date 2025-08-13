-- Check Old Trigger Functions
-- This shows us what the old trigger functions look like

SELECT '=== OLD TRIGGER FUNCTIONS ===' as section;

-- Check handle_new_client function
SELECT '=== handle_new_client FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_client';

-- Check handle_new_freelancer function  
SELECT '=== handle_new_freelancer FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_freelancer';

-- Check the new function for comparison
SELECT '=== NEW safe_handle_new_user_signup FUNCTION ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'safe_handle_new_user_signup';


