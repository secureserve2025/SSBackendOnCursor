-- =============================================================================
-- DEBUG FREELANCER MESSAGING ISSUE
-- This script checks the specific freelancer profile and project relationship
-- =============================================================================

-- Check the specific freelancer profile for the "Checklist Signed off" project
SELECT 
    fp.id as freelancer_profile_id,
    fp.user_id as freelancer_user_id,
    fp.freelancer_id as freelancer_display_id,
    fp.full_name,
    fp.email
FROM freelancer_profiles fp
WHERE fp.id = '480c4d90-d585-4469-b8d4-14dee52b507d';

-- Check all freelancer profiles to see their structure
SELECT 
    id as freelancer_profile_id,
    user_id as freelancer_user_id,
    freelancer_id as freelancer_display_id,
    full_name,
    email
FROM freelancer_profiles;

-- Check the specific project details
SELECT 
    p.id as project_id,
    p.project_id as project_display_id,
    p.project_name,
    p.project_status_workflow,
    p.client_id,
    p.freelancer_id,
    fp.full_name as freelancer_name,
    fp.user_id as freelancer_user_id
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.project_status_workflow = 'Checklist Signed off';

-- Test the exact query that the messaging function should use
-- Replace 'YOUR_FREELANCER_USER_ID' with the actual user_id from the freelancer profile above
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    fp.full_name as freelancer_name
FROM projects p
JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE fp.user_id = 'REPLACE_WITH_ACTUAL_USER_ID'
AND p.project_status_workflow != 'Project Created';
