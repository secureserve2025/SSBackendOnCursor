-- Verify the function is working correctly
-- Test the function directly

SELECT 'Testing validate_freelancer_complete function with F308208874:' as test_description;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Also test with a non-existent ID
SELECT 'Testing with non-existent ID F999999999:' as test_description;
SELECT * FROM validate_freelancer_complete('F999999999');

-- Check if function exists
SELECT 'Checking if function exists:' as check_type;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'validate_freelancer_complete' 
AND routine_schema = 'public';
