-- Test the project status history tracking system
-- This script tests all the functions and triggers

-- Test 1: Check if the table and functions were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'project_status_history';

-- Test 2: Check if the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_log_project_status_change';

-- Test 3: Check if the new columns were added to projects table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('updated_by_user_id', 'updated_by_user_type', 'status_change_reason')
ORDER BY column_name;

-- Test 4: Check current projects and their status
SELECT 
    id,
    project_id,
    project_status_workflow,
    updated_by_user_type,
    status_change_reason,
    created_at,
    updated_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 3;

-- Test 5: Test the manual_log_project_status_change function
-- (Replace 'your-project-id' with an actual project ID from your database)
-- SELECT manual_log_project_status_change(
--     'your-project-id'::UUID,
--     'Assigned to Freelancer',
--     '00000000-0000-0000-0000-000000000000'::UUID,
--     'client',
--     'Client assigned project to freelancer'
-- );

-- Test 6: Test the get_project_status_history function
-- (Replace 'your-project-id' with an actual project ID from your database)
-- SELECT * FROM get_project_status_history('your-project-id'::UUID);

-- Test 7: Test the get_project_status_summary function
-- (Replace 'your-project-id' with an actual project ID from your database)
-- SELECT * FROM get_project_status_summary('your-project-id'::UUID);

-- Test 8: Check if any status history records exist
SELECT 
    COUNT(*) as total_history_records,
    COUNT(DISTINCT project_id) as projects_with_history
FROM project_status_history;

-- Test 9: Show sample status history (if any exists)
SELECT 
    psh.project_id,
    p.project_id as project_display_id,
    psh.old_status,
    psh.new_status,
    psh.changed_by_user_type,
    psh.change_reason,
    psh.created_at
FROM project_status_history psh
JOIN projects p ON psh.project_id = p.id
ORDER BY psh.created_at DESC
LIMIT 5;

-- Test 10: Verify the trigger works by updating a project status
-- (This will create a history record automatically)
-- UPDATE projects 
-- SET 
--     project_status_workflow = 'Assigned to Freelancer',
--     updated_by_user_id = '00000000-0000-0000-0000-000000000000',
--     updated_by_user_type = 'client',
--     status_change_reason = 'Test status change via trigger'
-- WHERE id = 'your-project-id'; 