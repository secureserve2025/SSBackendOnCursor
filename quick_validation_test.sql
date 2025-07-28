-- Quick Validation Test
-- This script quickly checks if the freelancer profile restoration worked

-- 1. Check all freelancer profiles
SELECT 
  'All Freelancer Profiles' as test_type,
  freelancer_id,
  full_name,
  email,
  created_at
FROM freelancer_profiles 
ORDER BY created_at;

-- 2. Test specific freelancer ID lookup (F214000319)
SELECT 
  'Testing F214000319' as test_type,
  freelancer_id,
  full_name,
  email
FROM freelancer_profiles 
WHERE freelancer_id = 'F214000319';

-- 3. Count total freelancers
SELECT 
  'Total Freelancers' as test_type,
  COUNT(*) as count,
  STRING_AGG(freelancer_id, ', ') as all_ids
FROM freelancer_profiles;

-- 4. Test that both old and new IDs are accessible
SELECT 
  'Accessibility Test' as test_type,
  freelancer_id,
  CASE 
    WHEN freelancer_id = 'F214000319' THEN 'Original ID - Should work'
    ELSE 'New ID - Should also work'
  END as status
FROM freelancer_profiles; 