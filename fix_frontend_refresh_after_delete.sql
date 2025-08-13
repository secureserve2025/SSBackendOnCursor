-- Fix Frontend Refresh After Delete
-- This script checks for issues that might prevent proper frontend refresh

-- Check if the get_client_projects_display RPC function exists
SELECT 
    'RPC Function Check' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_client_projects_display';

-- Check current projects count for the client
SELECT 
    'Client Projects Count' as check_type,
    COUNT(*) as total_projects,
    COUNT(CASE WHEN project_status_workflow = 'Project Created' THEN 1 END) as projects_in_created_status,
    COUNT(CASE WHEN project_status_workflow != 'Project Created' THEN 1 END) as projects_not_in_created_status
FROM projects 
WHERE client_id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4';

-- Check if there are any projects with the same project_id as the deleted one
SELECT 
    'Duplicate Project ID Check' as check_type,
    project_id,
    COUNT(*) as count
FROM projects 
WHERE project_id = 'V1001'
GROUP BY project_id;

-- Test the direct query that the frontend fallback uses
SELECT 
    'Frontend Fallback Test' as check_type,
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.created_at,
    fp.full_name as freelancer_name,
    fp.email as freelancer_email,
    fp.freelancer_id as freelancer_display_id
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.client_id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'
ORDER BY p.updated_at DESC;









