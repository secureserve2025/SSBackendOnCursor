-- Fix project_status_workflow field length to accommodate longer status values
-- This script increases the field length from VARCHAR(25) to VARCHAR(50)

-- 1. Alter the column to increase its length
ALTER TABLE projects 
ALTER COLUMN project_status_workflow TYPE VARCHAR(50);

-- 2. Update the CHECK constraint to include all valid statuses
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;

ALTER TABLE projects 
ADD CONSTRAINT projects_project_status_workflow_check 
CHECK (project_status_workflow IN (
    'Project Created',
    'Assigned to Freelancer', 
    'Checklist Signed off',
    'Fund Secured',
    'Production in Progress',
    'AI Verified',
    'Under Manual Revision',
    'Successfully Closed',
    'Product Rejected'
));

-- 3. Update the function to accept VARCHAR(50)
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

-- 4. Test the function
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get a test project ID (use the first available project)
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test updating to "Checklist Signed off"
        SELECT update_project_status_workflow(test_project_id, 'Checklist Signed off') INTO test_result;
        
        IF test_result THEN
            RAISE NOTICE 'Test successful: Function can update to Checklist Signed off status';
        ELSE
            RAISE NOTICE 'Test failed: Function could not update project status';
        END IF;
    ELSE
        RAISE NOTICE 'No projects found for testing';
    END IF;
END $$; 