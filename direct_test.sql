-- Direct test for the specific freelancer ID
-- Let's test step by step

-- Test 1: Direct database query
SELECT 'Test 1: Direct database query for F308208874' as test_name;
SELECT 
    freelancer_id,
    full_name,
    account_status,
    profile_completed
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- Test 2: Test the simple function with the existing ID
SELECT 'Test 2: Simple function with F308208874' as test_name;
SELECT * FROM test_freelancer_lookup('F308208874');

-- Test 3: Test the complex function with the existing ID
SELECT 'Test 3: Complex function with F308208874' as test_name;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Test 4: Check if there are any special characters or encoding issues
SELECT 'Test 4: Check for encoding issues' as test_name;
SELECT 
    freelancer_id,
    LENGTH(freelancer_id) as length,
    ASCII(SUBSTRING(freelancer_id, 1, 1)) as first_char_ascii,
    ASCII(SUBSTRING(freelancer_id, 2, 1)) as second_char_ascii
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';
