-- Quick Client Profile Test
-- This script quickly checks if client profile restoration worked

-- 1. Check all client profiles
SELECT 
  'All Client Profiles' as test_type,
  client_id,
  full_name,
  email,
  profile_completed,
  created_at
FROM client_profiles 
ORDER BY created_at;

-- 2. Count total clients
SELECT 
  'Total Clients' as test_type,
  COUNT(*) as count,
  STRING_AGG(client_id, ', ') as all_ids
FROM client_profiles;

-- 3. Check if users have profiles
SELECT 
  'Users with Profiles' as test_type,
  u.email,
  cp.client_id,
  cp.full_name
FROM auth.users u
LEFT JOIN client_profiles cp ON u.id = cp.user_id
WHERE u.raw_user_meta_data->>'user_type' = 'client'
ORDER BY u.created_at DESC;

-- 4. Test profile access
SELECT 
  'Profile Access Test' as test_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'Client profiles are accessible'
    ELSE 'No client profiles found'
  END as accessibility_status,
  COUNT(*) as total_accessible
FROM client_profiles; 