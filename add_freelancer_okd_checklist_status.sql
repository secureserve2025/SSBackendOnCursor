-- Add "Freelancer OK Checklist" status to project workflow
-- This script adds a new workflow status for when freelancers approve the project checklist

-- 1. First, let's create a temporary function to safely update the CHECK constraint
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

-- 5. Add comment to document the new status
COMMENT ON COLUMN projects.project_status_workflow IS 'Workflow status of the project with predefined values including Freelancer OK Checklist';

-- 6. Create a function to get all valid workflow statuses
CREATE OR REPLACE FUNCTION get_valid_workflow_statuses()
RETURNS TABLE(status_value VARCHAR(25)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
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
    ]);
END;
$$ LANGUAGE plpgsql;

-- 7. Add comment to the new function
COMMENT ON FUNCTION get_valid_workflow_statuses() IS 'Returns all valid project workflow status values including Freelancer OK Checklist';

-- 8. Verify the changes by checking the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check'; 