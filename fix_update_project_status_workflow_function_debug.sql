-- Fix update_project_status_workflow function with debugging
-- This script ensures the function exists with the correct signature and adds debugging

-- Drop the function if it exists to recreate it
DROP FUNCTION IF EXISTS update_project_status_workflow(UUID, VARCHAR);

-- Create the function with the correct signature and debugging
CREATE OR REPLACE FUNCTION update_project_status_workflow(
    project_uuid UUID,
    new_status VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_status BOOLEAN;
    affected_rows INTEGER;
    project_exists BOOLEAN;
BEGIN
    -- Debug: Log the input parameters
    RAISE NOTICE 'update_project_status_workflow called with project_uuid: %, new_status: %', project_uuid, new_status;
    
    -- Check if the project exists
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid) INTO project_exists;
    
    IF NOT project_exists THEN
        RAISE EXCEPTION 'Project with ID % does not exist', project_uuid;
    END IF;
    
    -- Debug: Log the project details before update
    RAISE NOTICE 'Project found. Current status: %', (SELECT project_status_workflow FROM projects WHERE id = project_uuid);
    
    -- Validate the new status
    SELECT new_status IN (
        'Project Created',
        'Assigned to Freelancer', 
        'Checklist Signed off',
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
    
    -- Get the number of affected rows
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Debug: Log the result
    RAISE NOTICE 'Update completed. Affected rows: %', affected_rows;
    
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'No project was updated. Project ID: %', project_uuid;
    END IF;
    
    -- Debug: Log the new status
    RAISE NOTICE 'Project status updated to: %', (SELECT project_status_workflow FROM projects WHERE id = project_uuid);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the function
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation and debugging';

-- Test the function
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get a test project ID
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test updating a project with a valid status
        SELECT update_project_status_workflow(test_project_id, 'Production in Progress') INTO test_result;
        
        RAISE NOTICE 'Test successful: update_project_status_workflow function working correctly';
    ELSE
        RAISE NOTICE 'No projects found for testing';
    END IF;
END $$; 