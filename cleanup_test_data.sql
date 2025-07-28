-- Cleanup Test Data
-- This script removes the test freelancer profile that was created with a placeholder UUID

-- 1. First, let's see what freelancer profiles exist
SELECT freelancer_id, full_name, email, user_id 
FROM freelancer_profiles 
ORDER BY created_at DESC;

-- 2. Remove the test profile with placeholder UUID
-- This will only remove the test profile, not your real profile
DELETE FROM freelancer_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 3. Verify the cleanup
SELECT freelancer_id, full_name, email, user_id 
FROM freelancer_profiles 
ORDER BY created_at DESC;

-- 4. Test that your real freelancer profile is still accessible
SELECT freelancer_id, full_name, email 
FROM freelancer_profiles 
WHERE freelancer_id = 'F214000319';

-- 5. Confirm the table is still accessible
SELECT 'Cleanup completed - real profiles remain accessible' as status 
WHERE EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1); 