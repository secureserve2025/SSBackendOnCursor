-- =============================================================================
-- TEST MESSAGING FUNCTION LOGIC
-- This script tests the exact logic that the getProjectsForMessaging function uses
-- =============================================================================

-- Test 1: Check if we can find the freelancer profile for the "Checklist Signed off" project
SELECT 
    fp.id as freelancer_profile_id,
    fp.user_id as freelancer_user_id,
    fp.freelancer_id as freelancer_display_id,
    fp.full_name,
    fp.email
FROM freelancer_profiles fp
WHERE fp.id = '480c4d90-d585-4469-b8d4-14dee52b507d';

-- Test 2: Check if we can find projects for this freelancer (excluding "Project Created")
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    fp.full_name as freelancer_name
FROM projects p
JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE fp.id = '480c4d90-d585-4469-b8d4-14dee52b507d'
AND p.project_status_workflow != 'Project Created';

-- Test 3: Check all projects with their statuses
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    fp.full_name as freelancer_name
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
ORDER BY p.created_at DESC;

-- Test 4: Check if there are any projects that should be available for messaging
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN project_status_workflow != 'Project Created' THEN 1 END) as available_for_messaging,
    COUNT(CASE WHEN project_status_workflow = 'Checklist Signed off' THEN 1 END) as checklist_signed_off
FROM projects;
