-- =============================================================================
-- FINAL USER DELETION SCRIPT
-- =============================================================================
-- This script deletes all records related to the target email addresses
-- Based on actual database schema analysis
-- =============================================================================

BEGIN;

-- Log the deletion process
DO $$
DECLARE
    client_count INTEGER;
    freelancer_count INTEGER;
    auth_count INTEGER;
BEGIN
    -- Count records to be deleted
    SELECT COUNT(*) INTO client_count 
    FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');
    
    SELECT COUNT(*) INTO freelancer_count 
    FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');
    
    SELECT COUNT(*) INTO auth_count 
    FROM auth.users 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');
    
    RAISE NOTICE 'Records to be deleted: % client profiles, % freelancer profiles, % auth users', 
        client_count, freelancer_count, auth_count;
END $$;

-- Step 1: Delete from work_products (linked via project_id)
DELETE FROM work_products 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE client_id IN (
        SELECT id FROM client_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
    OR freelancer_id IN (
        SELECT id FROM freelancer_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
);

-- Step 2: Delete from verification_reports (linked via project_id)
DELETE FROM verification_reports 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE client_id IN (
        SELECT id FROM client_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
    OR freelancer_id IN (
        SELECT id FROM freelancer_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
);

-- Step 3: Delete from deliverables (linked via project_id)
DELETE FROM deliverables 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE client_id IN (
        SELECT id FROM client_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
    OR freelancer_id IN (
        SELECT id FROM freelancer_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
);

-- Step 4: Delete from project_messages (linked via project_id)
DELETE FROM project_messages 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE client_id IN (
        SELECT id FROM client_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
    OR freelancer_id IN (
        SELECT id FROM freelancer_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
);

-- Step 5: Delete from transactions (linked via project_id)
DELETE FROM transactions 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE client_id IN (
        SELECT id FROM client_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
    OR freelancer_id IN (
        SELECT id FROM freelancer_profiles 
        WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
    )
);

-- Step 6: Delete from projects (linked via client_id and freelancer_id)
DELETE FROM projects 
WHERE client_id IN (
    SELECT id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Step 7: Delete from client_profiles
DELETE FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Step 8: Delete from freelancer_profiles
DELETE FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Step 9: Delete from auth.users (authentication table)
DELETE FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Deletion completed successfully';
END $$;

-- Change ROLLBACK to COMMIT when ready to actually delete
COMMIT;



