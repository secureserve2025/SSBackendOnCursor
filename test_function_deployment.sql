-- Test if the function is properly deployed and working

-- Step 1: Check if function exists
SELECT 'Step 1: Check if function exists' as step;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'validate_freelancer_complete';

-- Step 2: Test function directly
SELECT 'Step 2: Test function with F308208874' as step;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Step 3: Test function with non-existent ID
SELECT 'Step 3: Test function with non-existent ID' as step;
SELECT * FROM validate_freelancer_complete('F999999999');

-- Step 4: Check the exact data in freelancer_profiles
SELECT 'Step 4: Check exact data for F308208874' as step;
SELECT 
    freelancer_id,
    full_name,
    email,
    mobile_number,
    upi_id,
    aadhar_number,
    account_status,
    profile_completed
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- Step 5: Test the exact query from the function
SELECT 'Step 5: Test the exact query from function' as step;
SELECT * 
FROM freelancer_profiles fp
WHERE fp.freelancer_id = 'F308208874';
