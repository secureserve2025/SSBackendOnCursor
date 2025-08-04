-- Comprehensive fix for project status workflow to include 'Freelancer OK Checklist'
-- This script fixes both the function and the database constraint

-- 1. First, update the database constraint to include the new status
CREATE OR REPLACE FUNCTION update_project_workflow_status_constraint()
RETURNS VOID AS $$
BEGIN
    -- Drop the existing CHECK constraint
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;
    
    -- Add the new CHECK constraint with the additional status
    ALTER TABLE projects ADD CONSTRAINT projects_project_status_workflow_check 
    CHECK (project_status_workflow IN (
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
    ));
END;
$$ LANGUAGE plpgsql;

-- 2. Execute the function to update the constraint
SELECT update_project_workflow_status_constraint();

-- 3. Drop the temporary function
DROP FUNCTION update_project_workflow_status_constraint();

-- 4. Update the update_project_status_workflow function to include the new status
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
        'Freelancer OK Checklist',
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

-- 5. Add comment to document the updated function
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation including Freelancer OK Checklist';

-- 6. Verify the changes by checking the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check';

-- 7. Test the function with a sample project
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get a test project ID (first project in the database)
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test updating to the new status
        SELECT update_project_status_workflow(test_project_id, 'Freelancer OK Checklist') INTO test_result;
        
        IF test_result THEN
            RAISE NOTICE 'Test successful: Function can update to Freelancer OK Checklist status';
        ELSE
            RAISE NOTICE 'Test failed: Function could not update project status';
        END IF;
    ELSE
        RAISE NOTICE 'No projects found for testing';
    END IF;
END $$; 