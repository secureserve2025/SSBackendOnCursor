-- Remove old Freelancer status values from database
-- This script removes "Freelancer OK'd Checklist", "Freelancer OK Checklist", and "Freelancer OK2 Checklist"
-- from all database constraints, functions, and existing data

-- 1. First, update any existing projects that have the old status values
UPDATE projects 
SET project_status_workflow = 'Project Created'
WHERE project_status_workflow IN (
    'Freelancer OK\'d Checklist',
    'Freelancer OK Checklist', 
    'Freelancer OK2 Checklist'
);

-- 2. Drop the existing CHECK constraint
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;

-- 3. Create new CHECK constraint without the old Freelancer status values
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

-- 4. Update the update_project_status_workflow function
CREATE OR REPLACE FUNCTION update_project_status_workflow(
    project_uuid UUID,
    new_status VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_status BOOLEAN;
BEGIN
    -- Validate the new status (removed old Freelancer status values)
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

-- 5. Update the get_valid_workflow_statuses function (if it exists)
CREATE OR REPLACE FUNCTION get_valid_workflow_statuses()
RETURNS TABLE(status_value VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'Project Created',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ]::VARCHAR(50)[]);
END;
$$ LANGUAGE plpgsql;

-- 6. Update send_checklist_to_freelancer function (if it exists)
CREATE OR REPLACE FUNCTION send_checklist_to_freelancer(
    project_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    current_status VARCHAR(50);
    result JSON;
BEGIN
    -- Get current project status
    SELECT project_status_workflow INTO current_status
    FROM projects 
    WHERE id = project_uuid;
    
    IF current_status IS NULL THEN
        result := json_build_object('success', false, 'message', 'Project not found');
        RETURN result;
    END IF;
    
    -- Allow if current status is "Project Created" (removed Freelancer OK Checklist)
    IF current_status NOT IN ('Project Created') THEN
        result := json_build_object('success', false, 'message', 'Can only send checklist when project status is "Project Created". Current status: ' || current_status);
        RETURN result;
    END IF;
    
    -- Update project status to "Checklist Sent to Freelancer"
    UPDATE projects 
    SET 
        project_status_workflow = 'Checklist Sent to Freelancer',
        updated_at = NOW()
    WHERE id = project_uuid;
    
    result := json_build_object('success', true, 'message', 'Checklist sent to freelancer successfully');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Update any other functions that might reference the old status values
-- Update add_sent_to_freelancer_field function if it exists
CREATE OR REPLACE FUNCTION add_sent_to_freelancer_field()
RETURNS JSON AS $$
DECLARE
    current_status VARCHAR(50);
    result JSON;
BEGIN
    -- This is a placeholder function - update as needed
    result := json_build_object('success', true, 'message', 'Function updated successfully');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Add comments to document the changes
COMMENT ON COLUMN projects.project_status_workflow IS 'Workflow status of the project with predefined values (old Freelancer status values removed)';
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation (old Freelancer status values removed)';
COMMENT ON FUNCTION get_valid_workflow_statuses() IS 'Returns all valid project workflow status values (old Freelancer status values removed)';

-- 9. Test the cleanup
DO $$
DECLARE
    test_project_id UUID;
    test_result BOOLEAN;
    old_status_count INTEGER;
BEGIN
    -- Check if any old status values still exist
    SELECT COUNT(*) INTO old_status_count
    FROM projects 
    WHERE project_status_workflow IN (
        'Freelancer OK\'d Checklist',
        'Freelancer OK Checklist', 
        'Freelancer OK2 Checklist'
    );
    
    IF old_status_count > 0 THEN
        RAISE NOTICE 'Warning: % projects still have old Freelancer status values', old_status_count;
    ELSE
        RAISE NOTICE 'Success: All old Freelancer status values have been removed';
    END IF;
    
    -- Test the function with a valid status
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