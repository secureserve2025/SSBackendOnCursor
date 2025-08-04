-- Test script to verify project status update functionality
-- This script tests the update_project_status_workflow function

-- 1. Check current function definition
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_project_status_workflow'
AND n.nspname = 'public';

-- 2. Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check';

-- 3. Check current projects and their statuses
SELECT 
    id,
    project_id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Test the function with a sample project
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
    current_status VARCHAR(25);
BEGIN
    -- Get a test project ID (first project in the database)
    SELECT id, project_status_workflow INTO test_project_id, current_status 
    FROM projects 
    WHERE project_status_workflow IN ('Project Created', 'Freelancer OK''d Checklist')
    LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with project ID: %, current status: %', test_project_id, current_status;
        
        -- Test updating to the new status
        SELECT update_project_status_workflow(test_project_id, 'Freelancer OK''d Checklist') INTO test_result;
        
        IF test_result THEN
            RAISE NOTICE 'Test successful: Function can update to Freelancer OK''d Checklist status';
            
            -- Verify the update
            SELECT project_status_workflow INTO current_status FROM projects WHERE id = test_project_id;
            RAISE NOTICE 'Updated status: %', current_status;
        ELSE
            RAISE NOTICE 'Test failed: Function could not update project status';
        END IF;
    ELSE
        RAISE NOTICE 'No suitable projects found for testing';
    END IF;
END $$;

-- 5. Show all valid statuses
SELECT unnest(ARRAY[
    'Project Created',
    'Assigned to Freelancer', 
    'Checklist Signed off',
    'Freelancer OK''d Checklist',
    'Fund Secured',
    'Production in Progress',
    'AI Verified',
    'Under Manual Revision',
    'Successfully Closed',
    'Product Rejected'
]) as valid_statuses; 