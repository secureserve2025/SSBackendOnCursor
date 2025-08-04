-- Fix the VARCHAR length issue for project_status_workflow field
-- The status "Checklist Sent to Freelancer" is 26 characters, but the field is only VARCHAR(25)

-- Update the column to allow longer status names
ALTER TABLE projects 
ALTER COLUMN project_status_workflow TYPE VARCHAR(50);

-- Update the constraint to allow longer status names
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;

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

-- Update the function to use VARCHAR(50)
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

-- Update the get_valid_workflow_statuses function
CREATE OR REPLACE FUNCTION get_valid_workflow_statuses()
RETURNS TABLE(status_value VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'Project Created'::VARCHAR(50),
        'Checklist Sent to Freelancer'::VARCHAR(50),
        'Assigned to Freelancer'::VARCHAR(50), 
        'Checklist Signed off'::VARCHAR(50),
        'Freelancer OK''d Checklist'::VARCHAR(50),
        'Fund Secured'::VARCHAR(50),
        'Production in Progress'::VARCHAR(50),
        'AI Verified'::VARCHAR(50),
        'Under Manual Revision'::VARCHAR(50),
        'Successfully Closed'::VARCHAR(50),
        'Product Rejected'::VARCHAR(50)
    ]);
END;
$$ LANGUAGE plpgsql;

-- Update the send_checklist_to_freelancer function
CREATE OR REPLACE FUNCTION send_checklist_to_freelancer(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    project_exists BOOLEAN;
    current_status VARCHAR(50);
BEGIN
    -- Check if project exists
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid) INTO project_exists;
    
    IF NOT project_exists THEN
        RAISE EXCEPTION 'Project with ID % does not exist', project_uuid;
    END IF;

    -- Get current status
    SELECT project_status_workflow INTO current_status FROM projects WHERE id = project_uuid;
    
    -- Allow if current status is "Project Created" OR "Freelancer OK Checklist"
IF current_status NOT IN ('Project Created', 'Freelancer OK Checklist') THEN
RAISE EXCEPTION 'Can only send checklist when project status is "Project Created" or "Freelancer OK Checklist". Current status: %', current_status;
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