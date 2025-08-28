-- =============================================================================
-- COMPREHENSIVE USER RECORD DELETION SCRIPT
-- =============================================================================
-- This script deletes all records related to the specified email addresses
-- from all tables including authentication table
-- 
-- TARGET EMAILS:
-- - sd@gmail.com
-- - freelancer@gmail.com  
-- - freelancer1@gmail.com
-- =============================================================================

-- Start transaction for safety
BEGIN;

-- =============================================================================
-- STEP 1: IDENTIFY USERS BY EMAIL ADDRESSES
-- =============================================================================

-- Get user IDs from auth.users table for the specified emails
DO $$
DECLARE
    user_id_sd UUID;
    user_id_freelancer UUID;
    user_id_freelancer1 UUID;
    client_id_sd VARCHAR(20);
    client_id_freelancer VARCHAR(20);
    client_id_freelancer1 VARCHAR(20);
    freelancer_id_sd VARCHAR(20);
    freelancer_id_freelancer VARCHAR(20);
    freelancer_id_freelancer1 VARCHAR(20);
BEGIN
    -- Get user IDs from auth.users
    SELECT id INTO user_id_sd FROM auth.users WHERE email = 'sd@gmail.com' LIMIT 1;
    SELECT id INTO user_id_freelancer FROM auth.users WHERE email = 'freelancer@gmail.com' LIMIT 1;
    SELECT id INTO user_id_freelancer1 FROM auth.users WHERE email = 'freelancer1@gmail.com' LIMIT 1;
    
    -- Get client IDs from client_profiles
    SELECT client_id INTO client_id_sd FROM client_profiles WHERE email = 'sd@gmail.com' LIMIT 1;
    SELECT client_id INTO client_id_freelancer FROM client_profiles WHERE email = 'freelancer@gmail.com' LIMIT 1;
    SELECT client_id INTO client_id_freelancer1 FROM client_profiles WHERE email = 'freelancer1@gmail.com' LIMIT 1;
    
    -- Get freelancer IDs from freelancer_profiles
    SELECT freelancer_id INTO freelancer_id_sd FROM freelancer_profiles WHERE email = 'sd@gmail.com' LIMIT 1;
    SELECT freelancer_id INTO freelancer_id_freelancer FROM freelancer_profiles WHERE email = 'freelancer@gmail.com' LIMIT 1;
    SELECT freelancer_id INTO freelancer_id_freelancer1 FROM freelancer_profiles WHERE email = 'freelancer1@gmail.com' LIMIT 1;
    
    -- Log the IDs found for verification
    RAISE NOTICE 'User IDs found: sd@gmail.com -> %, freelancer@gmail.com -> %, freelancer1@gmail.com -> %', 
                 user_id_sd, user_id_freelancer, user_id_freelancer1;
    RAISE NOTICE 'Client IDs found: sd@gmail.com -> %, freelancer@gmail.com -> %, freelancer1@gmail.com -> %', 
                 client_id_sd, client_id_freelancer, client_id_freelancer1;
    RAISE NOTICE 'Freelancer IDs found: sd@gmail.com -> %, freelancer@gmail.com -> %, freelancer1@gmail.com -> %', 
                 freelancer_id_sd, freelancer_id_freelancer, freelancer_id_freelancer1;
END $$;

-- =============================================================================
-- STEP 2: DELETE FROM WORK_PRODUCTS TABLE
-- =============================================================================

-- Delete work products related to these users
DELETE FROM work_products 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- =============================================================================
-- STEP 3: DELETE FROM VERIFICATION_REPORTS TABLE
-- =============================================================================

-- Delete verification reports related to these users
DELETE FROM verification_reports 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- =============================================================================
-- STEP 4: DELETE FROM MESSAGES TABLE
-- =============================================================================

-- Delete messages related to these users
DELETE FROM messages 
WHERE sender_id IN (
    SELECT user_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    UNION
    SELECT user_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR receiver_id IN (
    SELECT user_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    UNION
    SELECT user_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- =============================================================================
-- STEP 5: DELETE FROM TRANSACTIONS TABLE
-- =============================================================================

-- Delete transactions related to these users
DELETE FROM transactions 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- =============================================================================
-- STEP 6: DELETE FROM PROJECTS TABLE
-- =============================================================================

-- Delete projects related to these users
DELETE FROM projects 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- =============================================================================
-- STEP 7: DELETE FROM CLIENT_PROFILES TABLE
-- =============================================================================

-- Delete client profiles for these emails
DELETE FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- =============================================================================
-- STEP 8: DELETE FROM FREELANCER_PROFILES TABLE
-- =============================================================================

-- Delete freelancer profiles for these emails
DELETE FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- =============================================================================
-- STEP 9: DELETE FROM AUTH.USERS TABLE (AUTHENTICATION)
-- =============================================================================

-- Delete users from authentication table
DELETE FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- =============================================================================
-- STEP 10: VERIFICATION AND SUMMARY
-- =============================================================================

-- Show summary of what was deleted
SELECT 'DELETION SUMMARY' as summary_type;

-- Check remaining records for these emails
SELECT 'Remaining client profiles' as check_type, COUNT(*) as count
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
UNION ALL
SELECT 'Remaining freelancer profiles' as check_type, COUNT(*) as count
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
UNION ALL
SELECT 'Remaining auth users' as check_type, COUNT(*) as count
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
UNION ALL
SELECT 'Remaining projects' as check_type, COUNT(*) as count
FROM projects 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
UNION ALL
SELECT 'Remaining transactions' as check_type, COUNT(*) as count
FROM transactions 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
UNION ALL
SELECT 'Remaining messages' as check_type, COUNT(*) as count
FROM messages 
WHERE sender_id IN (
    SELECT user_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    UNION
    SELECT user_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR receiver_id IN (
    SELECT user_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    UNION
    SELECT user_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
UNION ALL
SELECT 'Remaining work products' as check_type, COUNT(*) as count
FROM work_products 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
UNION ALL
SELECT 'Remaining verification reports' as check_type, COUNT(*) as count
FROM verification_reports 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- =============================================================================
-- COMMIT TRANSACTION
-- =============================================================================

-- If everything looks good, commit the transaction
-- If you want to review first, change this to ROLLBACK
ROLLBACK;

-- =============================================================================
-- FINAL MESSAGE
-- =============================================================================

SELECT 'USER RECORD DELETION COMPLETED SUCCESSFULLY' as final_status;
SELECT 'All records for sd@gmail.com, freelancer@gmail.com, and freelancer1@gmail.com have been deleted.' as message;
