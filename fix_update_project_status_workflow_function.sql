-- Fix update_project_status_workflow function
-- This script ensures the function exists with the correct signature

-- Drop the function if it exists to recreate it
DROP FUNCTION IF EXISTS update_project_status_workflow(UUID, VARCHAR);

-- Create the function with the correct signature
CREATE OR REPLACE FUNCTION update_project_status_workflow(
    project_uuid UUID,
    new_status VARCHAR(50)
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

-- Add comment to document the function
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation';

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