-- Step 8: Check unique constraints
-- This checks if there are any unique constraints that might be causing conflicts

SELECT '=== UNIQUE CONSTRAINT CHECK ===' as section;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_name IN ('client_profiles', 'freelancer_profiles')
ORDER BY tc.table_name, tc.constraint_name;


