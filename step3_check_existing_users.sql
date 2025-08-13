-- Step 3: Check existing users with metadata
-- This shows us what users exist and their metadata

SELECT '=== EXISTING USERS WITH METADATA ===' as section;
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
