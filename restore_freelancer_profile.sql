-- Restore Original Freelancer Profile
-- This script restores the original freelancer profile with ID F214000319

-- 1. First, let's check what users exist in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Check what freelancer profiles currently exist
SELECT 
  freelancer_id,
  full_name,
  email,
  user_id,
  created_at
FROM freelancer_profiles 
ORDER BY created_at DESC;

-- 3. Restore the original freelancer profile
-- We'll use the first freelancer user from auth.users as the user_id
INSERT INTO freelancer_profiles (
  user_id,
  freelancer_id,
  full_name,
  email,
  mobile_number,
  profile_completed,
  profile_verified
) 
SELECT 
  u.id,
  'F214000319',
  'Original Test Freelancer',
  u.email,
  '9876543210',
  true,
  true
FROM auth.users u
WHERE u.raw_user_meta_data->>'user_type' = 'freelancer'
ORDER BY u.created_at ASC
LIMIT 1
ON CONFLICT (freelancer_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  mobile_number = EXCLUDED.mobile_number,
  profile_completed = EXCLUDED.profile_completed,
  profile_verified = EXCLUDED.profile_verified;

-- 4. Verify the restoration
SELECT 
  freelancer_id,
  full_name,
  email,
  created_at
FROM freelancer_profiles 
ORDER BY created_at DESC;

-- 5. Test that all freelancer IDs are accessible
SELECT 
  'Testing freelancer ID validation' as test_type,
  COUNT(*) as total_freelancers,
  STRING_AGG(freelancer_id, ', ') as all_freelancer_ids
FROM freelancer_profiles;

-- 6. Test specific freelancer ID lookup
SELECT 
  'Testing F214000319 lookup' as test_type,
  freelancer_id,
  full_name,
  email
FROM freelancer_profiles 
WHERE freelancer_id = 'F214000319';

-- 7. Verify RLS policies allow access to all freelancer IDs
SELECT 
  'RLS Policy Check' as test_type,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'freelancer_profiles' AND cmd = 'SELECT'; 