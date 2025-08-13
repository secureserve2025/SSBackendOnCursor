-- Debug Freelancer Validation Function
-- This script will help us understand why the validation is failing

-- 1. Check if the freelancer exists in the table
SELECT 'Checking if freelancer F308208874 exists in freelancer_profiles table:' as debug_step;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- 2. Check all freelancer IDs in the table
SELECT 'All freelancer IDs in the table:' as debug_step;
SELECT freelancer_id, full_name, account_status 
FROM freelancer_profiles 
ORDER BY freelancer_id;

-- 3. Test the validation function directly
SELECT 'Testing validate_freelancer_complete function with F308208874:' as debug_step;
SELECT * FROM validate_freelancer_complete('F308208874');

-- 4. Check the table structure
SELECT 'Freelancer profiles table structure:' as debug_step;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 5. Check for any data type mismatches
SELECT 'Checking data types of freelancer_id column:' as debug_step;
SELECT 
    freelancer_id,
    pg_typeof(freelancer_id) as data_type,
    LENGTH(freelancer_id) as length
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874'
LIMIT 1;
