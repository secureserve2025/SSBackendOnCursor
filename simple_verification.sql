-- =============================================================================
-- SIMPLE VERIFICATION - ALL COUNTS IN ONE RESULT
-- =============================================================================
-- This query shows all deletion counts in a single result set
-- =============================================================================

-- Get all deletion counts in one query
WITH target_emails AS (
    SELECT email FROM (VALUES 
        ('sd@gmail.com'), 
        ('freelancer@gmail.com'), 
        ('freelancer1@gmail.com')
    ) AS t(email)
),
target_projects AS (
    SELECT id FROM projects 
    WHERE client_id IN (
        SELECT id FROM client_profiles 
        WHERE email IN (SELECT email FROM target_emails)
    )
    OR freelancer_id IN (
        SELECT id FROM freelancer_profiles 
        WHERE email IN (SELECT email FROM target_emails)
    )
)
SELECT 
    'CLIENT_PROFILES' as table_name,
    COUNT(*) as records_to_delete
FROM client_profiles 
WHERE email IN (SELECT email FROM target_emails)

UNION ALL

SELECT 
    'FREELANCER_PROFILES' as table_name,
    COUNT(*) as records_to_delete
FROM freelancer_profiles 
WHERE email IN (SELECT email FROM target_emails)

UNION ALL

SELECT 
    'AUTH.USERS' as table_name,
    COUNT(*) as records_to_delete
FROM auth.users 
WHERE email IN (SELECT email FROM target_emails)

UNION ALL

SELECT 
    'PROJECTS' as table_name,
    COUNT(*) as records_to_delete
FROM projects 
WHERE id IN (SELECT id FROM target_projects)

UNION ALL

SELECT 
    'WORK_PRODUCTS' as table_name,
    COUNT(*) as records_to_delete
FROM work_products 
WHERE project_id IN (SELECT id FROM target_projects)

UNION ALL

SELECT 
    'VERIFICATION_REPORTS' as table_name,
    COUNT(*) as records_to_delete
FROM verification_reports 
WHERE project_id IN (SELECT id FROM target_projects)

UNION ALL

SELECT 
    'DELIVERABLES' as table_name,
    COUNT(*) as records_to_delete
FROM deliverables 
WHERE project_id IN (SELECT id FROM target_projects)

UNION ALL

SELECT 
    'PROJECT_MESSAGES' as table_name,
    COUNT(*) as records_to_delete
FROM project_messages 
WHERE project_id IN (SELECT id FROM target_projects)

UNION ALL

SELECT 
    'TRANSACTIONS' as table_name,
    COUNT(*) as records_to_delete
FROM transactions 
WHERE project_id IN (SELECT id FROM target_projects)

ORDER BY table_name;
