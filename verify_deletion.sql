-- =============================================================================
-- VERIFY DELETION - CONFIRM RECORDS ARE DELETED
-- =============================================================================
-- This script verifies that all target records have been deleted
-- =============================================================================

-- Check if any target emails still exist
SELECT 'VERIFICATION RESULTS' as section;

-- Check client_profiles
SELECT 'CLIENT_PROFILES - Remaining target emails:' as table_name, COUNT(*) as count
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check freelancer_profiles
SELECT 'FREELANCER_PROFILES - Remaining target emails:' as table_name, COUNT(*) as count
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check auth.users
SELECT 'AUTH.USERS - Remaining target emails:' as table_name, COUNT(*) as count
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check if any related projects still exist
SELECT 'PROJECTS - Remaining related projects:' as table_name, COUNT(*) as count
FROM projects 
WHERE client_id IN (
    SELECT id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Check if any related work_products still exist
SELECT 'WORK_PRODUCTS - Remaining related records:' as table_name, COUNT(*) as count
FROM work_products 
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

-- Check if any related verification_reports still exist
SELECT 'VERIFICATION_REPORTS - Remaining related records:' as table_name, COUNT(*) as count
FROM verification_reports 
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

-- Check if any related deliverables still exist
SELECT 'DELIVERABLES - Remaining related records:' as table_name, COUNT(*) as count
FROM deliverables 
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

-- Check if any related project_messages still exist
SELECT 'PROJECT_MESSAGES - Remaining related records:' as table_name, COUNT(*) as count
FROM project_messages 
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

-- Check if any related transactions still exist
SELECT 'TRANSACTIONS - Remaining related records:' as table_name, COUNT(*) as count
FROM transactions 
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
