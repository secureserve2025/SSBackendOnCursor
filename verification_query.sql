-- =============================================================================
-- VERIFICATION QUERY - SEE WHAT WOULD BE DELETED
-- =============================================================================
-- This query shows exactly what records would be deleted
-- =============================================================================

-- Check target emails in each table
SELECT 'TARGET EMAILS FOUND' as section;

-- Client profiles with target emails
SELECT 'CLIENT_PROFILES' as table_name, email, client_id, full_name 
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Freelancer profiles with target emails
SELECT 'FREELANCER_PROFILES' as table_name, email, freelancer_id, full_name 
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Auth users with target emails
SELECT 'AUTH.USERS' as table_name, email, id 
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check related projects
SELECT 'RELATED PROJECTS' as section;
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    cp.email as client_email,
    fp.email as freelancer_email
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE cp.email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
   OR fp.email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Count records that would be deleted from each table
SELECT 'RECORDS TO BE DELETED' as section;

-- Work products count
SELECT 'WORK_PRODUCTS' as table_name, COUNT(*) as count_to_delete
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

-- Verification reports count
SELECT 'VERIFICATION_REPORTS' as table_name, COUNT(*) as count_to_delete
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

-- Deliverables count
SELECT 'DELIVERABLES' as table_name, COUNT(*) as count_to_delete
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

-- Project messages count
SELECT 'PROJECT_MESSAGES' as table_name, COUNT(*) as count_to_delete
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

-- Transactions count
SELECT 'TRANSACTIONS' as table_name, COUNT(*) as count_to_delete
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

-- Projects count
SELECT 'PROJECTS' as table_name, COUNT(*) as count_to_delete
FROM projects 
WHERE client_id IN (
    SELECT id FROM client_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
)
OR freelancer_id IN (
    SELECT id FROM freelancer_profiles 
    WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
);

-- Profile counts
SELECT 'CLIENT_PROFILES' as table_name, COUNT(*) as count_to_delete
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

SELECT 'FREELANCER_PROFILES' as table_name, COUNT(*) as count_to_delete
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

SELECT 'AUTH.USERS' as table_name, COUNT(*) as count_to_delete
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');



