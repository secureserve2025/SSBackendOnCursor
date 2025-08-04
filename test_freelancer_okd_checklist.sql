-- Test the Freelancer OK Checklist functionality
-- This script tests the status change from "Project Created" to "Freelancer OK Checklist"

-- Test 1: Check if the status exists in the constraint
SELECT 
    constraint_name,
    constraint_definition
FROM information_schema.check_constraints 
WHERE constraint_name = 'projects_project_status_workflow_check';

-- Test 2: Check current projects and their status
SELECT 
    id,
    project_id,
    project_status_workflow,
    created_at,
    updated_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 3: Test updating a project status to "Freelancer OK Checklist"
-- (Replace 'your-project-id' with an actual project ID from your database)
-- UPDATE projects 
-- SET 
--     project_status_workflow = 'Freelancer OK''d Checklist',
--     updated_at = NOW()
-- WHERE id = 'your-project-id';

-- Test 4: Verify the status change was recorded in history (if history system is active)
-- SELECT 
--     psh.project_id,
--     p.project_id as project_display_id,
--     psh.old_status,
--     psh.new_status,
--     psh.changed_by_user_type,
--     psh.change_reason,
--     psh.created_at
-- FROM project_status_history psh
-- JOIN projects p ON psh.project_id = p.id
-- WHERE psh.new_status = 'Freelancer OK''d Checklist'
-- ORDER BY psh.created_at DESC
-- LIMIT 5;

-- Test 5: Check if any projects currently have "Freelancer OK Checklist" status
SELECT 
    COUNT(*) as projects_with_freelancer_okd_status
FROM projects 
WHERE project_status_workflow = 'Freelancer OK Checklist';

-- Test 6: Show projects that can be updated to "Freelancer OK Checklist"
-- (Projects with "Project Created" status)
SELECT 
    id,
    project_id,
    project_status_workflow,
    created_at
FROM projects 
WHERE project_status_workflow = 'Project Created'
ORDER BY created_at DESC;

-- Test 7: Verify the status is valid in the workflow
SELECT 
    unnest(ARRAY[
        'Project Created',
        'Assigned to Freelancer',
        'Checklist Signed off',
        'Freelancer OK Checklist',
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ]::VARCHAR(50)[]) as valid_statuses; 