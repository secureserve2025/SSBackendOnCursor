-- Check and Restore Client Profile
-- This script checks for missing client profiles and restores them

-- 1. Check what users exist in auth.users
SELECT 
  'Auth Users' as test_type,
  id,
  email,
  created_at,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users 
WHERE raw_user_meta_data->>'user_type' = 'client'
ORDER BY created_at DESC;

-- 2. Check what client profiles currently exist
SELECT 
  'Existing Client Profiles' as test_type,
  client_id,
  full_name,
  email,
  user_id,
  created_at
FROM client_profiles 
ORDER BY created_at DESC;

-- 3. Check for users without profiles
SELECT 
  'Users Without Profiles' as test_type,
  u.id,
  u.email,
  u.created_at,
  cp.client_id
FROM auth.users u
LEFT JOIN client_profiles cp ON u.id = cp.user_id
WHERE u.raw_user_meta_data->>'user_type' = 'client' AND cp.user_id IS NULL;

-- 4. Restore client profiles for users who don't have them
-- First, let's create a temporary table to avoid duplicates
WITH users_without_profiles AS (
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name
  FROM auth.users u
  LEFT JOIN client_profiles cp ON u.id = cp.user_id
  WHERE u.raw_user_meta_data->>'user_type' = 'client' 
    AND cp.user_id IS NULL
)
INSERT INTO client_profiles (
  user_id,
  client_id,
  full_name,
  email,
  mobile_number,
  profile_completed,
  profile_verified
) 
SELECT 
  uwp.id,
  'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
  COALESCE(uwp.full_name, 'Client User'),
  uwp.email,
  '0000000000',
  false,
  false
FROM users_without_profiles uwp;

-- 5. Verify the restoration
SELECT 
  'Restored Client Profiles' as test_type,
  client_id,
  full_name,
  email,
  profile_completed,
  profile_verified
FROM client_profiles 
ORDER BY created_at DESC;

-- 6. Test client profile access
SELECT 
  'Client Profile Access Test' as test_type,
  COUNT(*) as total_clients,
  STRING_AGG(client_id, ', ') as all_client_ids
FROM client_profiles;

-- 7. Check RLS policies for client profiles
SELECT 
  'Client RLS Policy Check' as test_type,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'client_profiles' AND cmd = 'SELECT'; 