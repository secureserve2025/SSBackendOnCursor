-- Check existing users and create freelancer profile
-- Run this in Supabase SQL editor

-- 1. Check existing auth users
SELECT '=== EXISTING AUTH USERS ===' as section;
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check existing freelancer profiles
SELECT '=== EXISTING FREELANCER PROFILES ===' as section;
SELECT 
    user_id,
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles
ORDER BY created_at DESC;

-- 3. Check existing client profiles
SELECT '=== EXISTING CLIENT PROFILES ===' as section;
SELECT 
    user_id,
    client_id,
    full_name,
    email
FROM client_profiles
ORDER BY created_at DESC;

-- 4. Create a freelancer profile using the first available user
-- (Replace 'USER_ID_HERE' with an actual user ID from step 1)
SELECT '=== CREATING FREELANCER PROFILE ===' as section;

-- This will create a freelancer profile for the first user found
-- You can modify the user_id below to use a specific user
WITH first_user AS (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
)
INSERT INTO freelancer_profiles (
    user_id,
    freelancer_id,
    full_name,
    email,
    mobile_number,
    country_code,
    upi_id,
    aadhar_number,
    profile_completed,
    profile_verified,
    account_status,
    created_at,
    updated_at
)
SELECT 
    fu.id,
    'F123456789',
    'Test Freelancer',
    'test.freelancer@example.com',
    '9876543210',
    '+91',
    'testfreelancer@upi',
    '123456789012',
    true,
    true,
    'active',
    NOW(),
    NOW()
FROM first_user fu
ON CONFLICT (user_id) DO UPDATE SET
    freelancer_id = EXCLUDED.freelancer_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    mobile_number = EXCLUDED.mobile_number,
    country_code = EXCLUDED.country_code,
    upi_id = EXCLUDED.upi_id,
    aadhar_number = EXCLUDED.aadhar_number,
    profile_completed = EXCLUDED.profile_completed,
    profile_verified = EXCLUDED.profile_verified,
    account_status = EXCLUDED.account_status,
    updated_at = NOW();

-- 5. Verify the freelancer was created
SELECT '=== VERIFICATION ===' as section;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed,
    profile_verified
FROM freelancer_profiles 
WHERE freelancer_id = 'F123456789';

-- 6. Test the function
SELECT '=== FUNCTION TEST ===' as section;
SELECT * FROM get_all_active_freelancer_ids();


