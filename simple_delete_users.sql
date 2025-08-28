-- =============================================================================
-- SIMPLE USER RECORD DELETION SCRIPT
-- =============================================================================
-- Quick deletion of all records for specified email addresses
-- 
-- TARGET EMAILS:
-- - sd@gmail.com
-- - freelancer@gmail.com  
-- - freelancer1@gmail.com
-- =============================================================================

-- Start transaction
BEGIN;

-- Delete from work_products table
DELETE FROM work_products 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Delete from verification_reports table
DELETE FROM verification_reports 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Delete from messages table
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

-- Delete from transactions table
DELETE FROM transactions 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Delete from projects table
DELETE FROM projects 
WHERE client_id IN (
    SELECT client_id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT freelancer_id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Delete from client_profiles table
DELETE FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Delete from freelancer_profiles table
DELETE FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Delete from auth.users table (authentication)
DELETE FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Commit the transaction
COMMIT;

-- Verification query
SELECT 'DELETION COMPLETED' as status;
