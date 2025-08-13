-- Step 4: Simple metadata access test
-- This tests how the trigger function would access user metadata

SELECT '=== SIMPLE METADATA ACCESS TEST ===' as section;

-- Test accessing user_type from the most recent user
SELECT 
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'user_type' as user_type,
    CASE 
        WHEN raw_user_meta_data->>'user_type' = 'client' THEN 'CLIENT DETECTED'
        WHEN raw_user_meta_data->>'user_type' = 'freelancer' THEN 'FREELANCER DETECTED'
        ELSE 'UNKNOWN USER TYPE'
    END as user_type_status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;


