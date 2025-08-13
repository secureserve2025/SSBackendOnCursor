-- Simple function test
-- Let's test the function step by step

-- Test 1: Direct function call
SELECT 'Test 1: Direct function call' as test_name;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Test 2: Check if we can call the function at all
SELECT 'Test 2: Function call test' as test_name;
SELECT validate_freelancer_complete('F308208874');

-- Test 3: Check the function signature
SELECT 'Test 3: Function signature' as test_name;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'validate_freelancer_complete' 
AND routine_schema = 'public';
