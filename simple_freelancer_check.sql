-- Simple check to see if freelancer F308208874 exists
SELECT 'Direct check for freelancer F308208874:' as check_type;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- Check all freelancer IDs to see what's available
SELECT 'All freelancer IDs in the table:' as check_type;
SELECT freelancer_id, full_name, account_status, profile_completed
FROM freelancer_profiles 
ORDER BY freelancer_id;

-- Check if there are any case sensitivity issues
SELECT 'Case-insensitive check for F308208874:' as check_type;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles 
WHERE LOWER(freelancer_id) = LOWER('F308208874');
