-- Create a test freelancer profile for dropdown testing
-- This will create a complete, active freelancer profile

-- First, let's create a test user in auth.users (if needed)
-- Note: You'll need to create this user through the app or Supabase auth

-- Create a test freelancer profile
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
) VALUES (
    'test-freelancer-user-id', -- Replace with actual user ID from auth.users
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
) ON CONFLICT (user_id) DO UPDATE SET
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

-- Verify the freelancer was created
SELECT '=== TEST FREELANCER CREATED ===' as status;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed,
    profile_verified
FROM freelancer_profiles 
WHERE freelancer_id = 'F123456789';

-- Test the function
SELECT '=== TESTING FUNCTION ===' as status;
SELECT * FROM get_all_active_freelancer_ids();

-- Show all freelancers
SELECT '=== ALL FREELANCERS ===' as status;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles
ORDER BY created_at DESC; 