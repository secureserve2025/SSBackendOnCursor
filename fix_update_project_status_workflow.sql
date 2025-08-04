-- Fix update_project_status_workflow function to include 'Freelancer Ok2 Checklist' status
-- This script updates the function to allow the new status that was missing

-- Update the update_project_status_workflow function to include the new status
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
        'Freelancer OK\'d Checklist',
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

-- Add comment to document the updated function
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation including Freelancer OK''d Checklist';

-- Test the function to make sure it works
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get a test project ID (first project in the database)
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test updating to the new status
        SELECT update_project_status_workflow(test_project_id, 'Freelancer OK''d Checklist') INTO test_result;
        
        IF test_result THEN
            RAISE NOTICE 'Test successful: Function can update to Freelancer OK''d Checklist status';
        ELSE
            RAISE NOTICE 'Test failed: Function could not update project status';
        END IF;
    ELSE
        RAISE NOTICE 'No projects found for testing';
    END IF;
END $$; 