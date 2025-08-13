-- Check if profile was created for the new user
-- This will verify if the trigger worked properly

SELECT '=== CHECKING PROFILE CREATION ===' as section;

-- Check if the new user exists in auth.users
SELECT '=== NEW USER IN AUTH.USERS ===' as section;
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'ktforever123@gmail.com'
ORDER BY created_at DESC;

-- Check if freelancer profile was created
SELECT '=== FREELANCER PROFILE CHECK ===' as section;
SELECT 
    user_id,
    freelancer_id,
    email,
    full_name,
    created_at
FROM freelancer_profiles 
WHERE email = 'ktforever123@gmail.com'
ORDER BY created_at DESC;

-- Check if client profile was created (should not exist)
SELECT '=== CLIENT PROFILE CHECK ===' as section;
SELECT 
    user_id,
    client_id,
    email,
    full_name,
    created_at
FROM client_profiles 
WHERE email = 'ktforever123@gmail.com'
ORDER BY created_at DESC;


