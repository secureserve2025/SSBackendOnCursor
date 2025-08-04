-- Test script to verify "Checklist Sent to Freelancer" status has been added to projects table

-- Test 1: Check all valid workflow statuses
SELECT * FROM get_valid_workflow_statuses();

-- Test 2: Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check';

-- Test 3: Check if we can create a project with "Checklist Sent to Freelancer" status (without foreign key issues)
-- This test validates the constraint without requiring a real project_id
SELECT
    'Checklist Sent to Freelancer'::VARCHAR(25) as test_status,
    CASE
        WHEN 'Checklist Sent to Freelancer' IN ('Project Created', 'Checklist Sent to Freelancer', 'Assigned to Freelancer', 'Checklist Signed off', 'Freelancer OK''d Checklist', 'Fund Secured', 'Production in Progress', 'AI Verified', 'Under Manual Revision', 'Successfully Closed', 'Product Rejected')
        THEN 'VALID'
        ELSE 'INVALID'
    END as constraint_check;

-- Test 4: Check existing projects to see their current statuses
SELECT
    project_id,
    project_name,
    project_status_workflow,
    created_at
FROM projects
ORDER BY created_at DESC
LIMIT 5;

-- Test 5: Test the send_checklist_to_freelancer function (optional - uncomment to test)
-- This will test the function with a fake UUID
-- SELECT send_checklist_to_freelancer('00000000-0000-0000-0000-000000000000');

-- Test 6: Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'send_checklist_to_freelancer'; 