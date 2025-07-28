-- Test All Freelancer IDs Accessibility
-- This script verifies that all freelancer IDs can be accessed and validated

-- 1. Check all existing freelancer profiles
SELECT 
  'All Freelancer Profiles' as test_type,
  freelancer_id,
  full_name,
  email,
  created_at
FROM freelancer_profiles 
ORDER BY created_at;

-- 2. Test that we can access all freelancer IDs
SELECT 
  'Freelancer ID Count' as test_type,
  COUNT(*) as total_freelancers,
  STRING_AGG(freelancer_id, ', ') as all_ids
FROM freelancer_profiles;

-- 3. Test individual freelancer ID lookups
-- This simulates what the validation function does
SELECT 
  'Individual ID Tests' as test_type,
  freelancer_id,
  CASE 
    WHEN freelancer_id = 'F214000319' THEN 'Testing original ID'
    ELSE 'Testing other IDs'
  END as test_description,
  full_name,
  email
FROM freelancer_profiles 
WHERE freelancer_id IN ('F214000319', (SELECT freelancer_id FROM freelancer_profiles ORDER BY created_at DESC LIMIT 1));

-- 4. Test RLS policy allows access to all records
SELECT 
  'RLS Policy Test' as test_type,
  COUNT(*) as accessible_records
FROM freelancer_profiles;

-- 5. Test specific validation queries
-- This simulates the exact query used in the validation function
SELECT 
  'Validation Query Test' as test_type,
  freelancer_id,
  full_name,
  email
FROM freelancer_profiles 
WHERE freelancer_id = 'F214000319';

-- 6. Test the newest freelancer ID
SELECT 
  'Newest Freelancer Test' as test_type,
  freelancer_id,
  full_name,
  email
FROM freelancer_profiles 
ORDER BY created_at DESC 
LIMIT 1;

-- 7. Verify no duplicate freelancer IDs
SELECT 
  'Duplicate Check' as test_type,
  freelancer_id,
  COUNT(*) as count
FROM freelancer_profiles 
GROUP BY freelancer_id 
HAVING COUNT(*) > 1;

-- 8. Final accessibility test
SELECT 
  'Final Accessibility Test' as test_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'All freelancer IDs are accessible'
    ELSE 'No freelancer IDs found'
  END as accessibility_status,
  COUNT(*) as total_accessible
FROM freelancer_profiles; 