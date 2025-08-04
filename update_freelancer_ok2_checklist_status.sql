-- Update project status from "Freelancer OK'd Checklist" to "Freelancer Ok2 Checklist"
-- This script updates the database constraint and functions to use the shorter status value

-- 1. First, update any existing projects with the old status
UPDATE projects 
SET project_status_workflow = 'Freelancer Ok2 Checklist'
WHERE project_status_workflow = 'Freelancer OK''d Checklist';

-- 2. Update the database constraint to use the new status
CREATE OR REPLACE FUNCTION update_project_workflow_status_constraint()
RETURNS VOID AS $$
BEGIN
    -- Drop the existing CHECK constraint
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;
    
    -- Add the new CHECK constraint with the updated status
    ALTER TABLE projects ADD CONSTRAINT projects_project_status_workflow_check 
    CHECK (project_status_workflow IN (
        'Project Created',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Freelancer Ok2 Checklist',
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ));
END;
$$ LANGUAGE plpgsql;

-- 3. Execute the function to update the constraint
SELECT update_project_workflow_status_constraint();

-- 4. Drop the temporary function
DROP FUNCTION update_project_workflow_status_constraint();

-- 5. Update the update_project_status_workflow function to include the new status
CREATE OR REPLACE FUNCTION update_project_status_workflow(
    project_uuid UUID,
    new_status VARCHAR(25)
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_status BOOLEAN;
BEGIN
    -- Validate the new status
    SELECT new_status IN (
        'Project Created',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Freelancer Ok2 Checklist',
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ) INTO valid_status;
    
    IF NOT valid_status THEN
        RAISE EXCEPTION 'Invalid project status: %', new_status;
    END IF;
    
    -- Update the project status
    UPDATE projects 
    SET 
        project_status_workflow = new_status,
        updated_at = NOW()
    WHERE id = project_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Update the get_valid_workflow_statuses function
CREATE OR REPLACE FUNCTION get_valid_workflow_statuses()
RETURNS TABLE(status_value VARCHAR(25)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'Project Created',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Freelancer Ok2 Checklist',
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ]);
END;
$$ LANGUAGE plpgsql;

-- 7. Update comments to reflect the new status
COMMENT ON COLUMN projects.project_status_workflow IS 'Workflow status of the project with predefined values including Freelancer Ok2 Checklist';
COMMENT ON FUNCTION get_valid_workflow_statuses() IS 'Returns all valid project workflow status values including Freelancer Ok2 Checklist';
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation including Freelancer Ok2 Checklist';

-- 8. Verify the changes by checking the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check';

-- 9. Test the function with the new status
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get a test project ID (first project in the database)
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test updating to the new status
        SELECT update_project_status_workflow(test_project_id, 'Freelancer Ok2 Checklist') INTO test_result;
        
        IF test_result THEN
            RAISE NOTICE 'Test successful: Function can update to Freelancer Ok2 Checklist status';
        ELSE
            RAISE NOTICE 'Test failed: Function could not update project status';
        END IF;
    ELSE
        RAISE NOTICE 'No projects found for testing';
    END IF;
END $$; 