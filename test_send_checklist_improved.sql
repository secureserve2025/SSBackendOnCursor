-- Test the improved send_checklist_to_freelancer function
-- This function now returns JSON with success status and message

-- Test 1: Check if the function exists and its return type
SELECT 
    routine_name,
    data_type,
    parameter_name,
    parameter_mode,
    parameter_default
FROM information_schema.parameters 
WHERE routine_name = 'send_checklist_to_freelancer'
ORDER BY ordinal_position;

-- Test 2: Test with a non-existent project ID
SELECT send_checklist_to_freelancer('00000000-0000-0000-0000-000000000000');

-- Test 3: Check current projects and their sent_to_freelancer status
SELECT 
    id,
    project_id,
    project_status_workflow,
    sent_to_freelancer,
    created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 4: Test with an existing project (replace with actual project ID)
-- SELECT send_checklist_to_freelancer('your-actual-project-id-here');

-- Test 5: Verify the function returns proper JSON structure
-- The function should return JSON with:
-- - success: boolean
-- - message: string
-- - already_sent: boolean (only when success is true) 