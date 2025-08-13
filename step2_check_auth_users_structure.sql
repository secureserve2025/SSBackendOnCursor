-- Step 2: Check auth.users table structure
-- This shows us what columns exist in the auth.users table

SELECT '=== AUTH.USERS COLUMNS ===' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY column_name;


