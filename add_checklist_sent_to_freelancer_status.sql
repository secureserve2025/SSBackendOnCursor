-- Add "Checklist Sent to Freelancer" status to project workflow
-- This script adds a new workflow status for when clients send the checklist to freelancers

-- 1. First, let's create a temporary function to safely update the CHECK constraint
CREATE OR REPLACE FUNCTION update_project_workflow_status_constraint_v2()
RETURNS VOID AS $$
BEGIN
    -- Drop the existing CHECK constraint
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;
    
    -- Add the new CHECK constraint with the additional status
    ALTER TABLE projects ADD CONSTRAINT projects_project_status_workflow_check 
    CHECK (project_status_workflow IN (
        'Project Created',
        'Checklist Sent to Freelancer',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Freelancer OK''d Checklist',
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
SELECT update_project_workflow_status_constraint_v2();

-- 3. Drop the temporary function
DROP FUNCTION update_project_workflow_status_constraint_v2();

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
        'Checklist Sent to Freelancer',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Freelancer OK''d Checklist',
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

-- 5. Update the get_valid_workflow_statuses function
CREATE OR REPLACE FUNCTION get_valid_workflow_statuses()
RETURNS TABLE(status_value VARCHAR(25)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'Project Created'::VARCHAR(25),
        'Checklist Sent to Freelancer'::VARCHAR(25),
        'Assigned to Freelancer'::VARCHAR(25), 
        'Checklist Signed off'::VARCHAR(25),
        'Freelancer OK''d Checklist'::VARCHAR(25),
        'Fund Secured'::VARCHAR(25),
        'Production in Progress'::VARCHAR(25),
        'AI Verified'::VARCHAR(25),
        'Under Manual Revision'::VARCHAR(25),
        'Successfully Closed'::VARCHAR(25),
        'Product Rejected'::VARCHAR(25)
    ]);
END;
$$ LANGUAGE plpgsql;

-- 6. Add comment to document the new status
COMMENT ON COLUMN projects.project_status_workflow IS 'Workflow status of the project with predefined values including Checklist Sent to Freelancer';

-- 7. Create a function to send checklist to freelancer
CREATE OR REPLACE FUNCTION send_checklist_to_freelancer(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    project_exists BOOLEAN;
    current_status VARCHAR(25);
BEGIN
    -- Check if project exists
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid) INTO project_exists;
    
    IF NOT project_exists THEN
        RAISE EXCEPTION 'Project with ID % does not exist', project_uuid;
    END IF;

    -- Get current status
    SELECT project_status_workflow INTO current_status FROM projects WHERE id = project_uuid;
    
    -- Only allow if current status is "Project Created"
    IF current_status != 'Project Created' THEN
        RAISE EXCEPTION 'Can only send checklist when project status is "Project Created". Current status: %', current_status;
    END IF;

    -- Update project status to "Checklist Sent to Freelancer"
    UPDATE projects 
    SET 
        project_status_workflow = 'Checklist Sent to Freelancer',
        updated_at = NOW()
    WHERE id = project_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Add comment to the new function
COMMENT ON FUNCTION send_checklist_to_freelancer(UUID) IS 'Sends the project checklist to the freelancer by updating status to Checklist Sent to Freelancer';

-- 9. Verify the changes by checking the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'projects_project_status_workflow_check';

-- 10. Test the new function (optional - uncomment to test)
-- SELECT send_checklist_to_freelancer('00000000-0000-0000-0000-000000000000'); 