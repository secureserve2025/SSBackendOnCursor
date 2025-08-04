-- Run the Freelancer Ok'd Checklist status update
-- This script executes the database changes and tests the new status

-- 1. Run the main update script
\i add_freelancer_okd_checklist_status.sql

-- 2. Test the new status by trying to update a project
-- (This will only work if you have existing projects in your database)
DO $$
DECLARE
    test_project_id UUID;
BEGIN
    -- Try to find an existing project to test with
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test updating to the new status
        PERFORM update_project_status_workflow(test_project_id, 'Freelancer OK''d Checklist');
        RAISE NOTICE 'Successfully updated project % to Freelancer OK''d Checklist status', test_project_id;
        
        -- Verify the update
        IF EXISTS (
            SELECT 1 FROM projects 
            WHERE id = test_project_id 
            AND project_status_workflow = 'Freelancer OK''d Checklist'
        ) THEN
            RAISE NOTICE '✅ Verification successful: Project status updated correctly';
        ELSE
            RAISE NOTICE '❌ Verification failed: Project status not updated';
        END IF;
    ELSE
        RAISE NOTICE 'No projects found in database to test with';
    END IF;
END $$;

-- 3. Test the get_valid_workflow_statuses function
SELECT 'Testing get_valid_workflow_statuses function:' as test_description;
SELECT status_value FROM get_valid_workflow_statuses() WHERE status_value = 'Freelancer OK''d Checklist';

-- 4. Show all valid workflow statuses
SELECT 'All valid workflow statuses:' as status_list;
SELECT status_value FROM get_valid_workflow_statuses() ORDER BY status_value;

-- 5. Show the current constraint definition
SELECT 'Current constraint definition:' as constraint_info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check'; 