-- Debug the database function step by step
-- Let's see what's happening inside the function

-- Test 1: Direct query to see if freelancer exists
SELECT 'Test 1: Direct query for F308208874' as test_name;
SELECT 
    freelancer_id,
    full_name,
    account_status,
    profile_completed
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- Test 2: Test with table alias (like the function does)
SELECT 'Test 2: Query with table alias' as test_name;
SELECT 
    fp.freelancer_id,
    fp.full_name,
    fp.account_status,
    fp.profile_completed
FROM freelancer_profiles fp
WHERE fp.freelancer_id = 'F308208874';

-- Test 3: Test the function directly
SELECT 'Test 3: Function call' as test_name;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Test 4: Check if there are any case sensitivity issues
SELECT 'Test 4: Case sensitivity test' as test_name;
SELECT 
    freelancer_id,
    LOWER(freelancer_id) as lower_id,
    UPPER(freelancer_id) as upper_id
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874'
   OR LOWER(freelancer_id) = LOWER('F308208874')
   OR UPPER(freelancer_id) = UPPER('F308208874');

-- Test 5: Check all freelancer IDs to see what's available
SELECT 'Test 5: All freelancer IDs' as test_name;
SELECT freelancer_id, full_name, account_status, profile_completed
FROM freelancer_profiles 
ORDER BY freelancer_id;
