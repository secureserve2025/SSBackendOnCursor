-- Get the full source code of old trigger functions
-- This will show us exactly what the old functions do

SELECT '=== OLD TRIGGER FUNCTIONS FULL SOURCE ===' as section;

-- Get handle_new_client full source
SELECT '=== handle_new_client FULL SOURCE ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_client';

-- Get handle_new_freelancer full source
SELECT '=== handle_new_freelancer FULL SOURCE ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_freelancer';

-- Compare with new function
SELECT '=== NEW FUNCTION FOR COMPARISON ===' as section;
SELECT prosrc FROM pg_proc WHERE proname = 'safe_handle_new_user_signup';


