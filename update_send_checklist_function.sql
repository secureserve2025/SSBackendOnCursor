-- Update send_checklist_to_freelancer function to allow both "Project Created" and "Freelancer OK Checklist" statuses

-- Update the function to allow both statuses
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

-- Update the comment to reflect the new functionality
COMMENT ON FUNCTION send_checklist_to_freelancer(UUID) IS 'Sends the project checklist to the freelancer by updating status to Checklist Sent to Freelancer. Works for both "Project Created" and "Freelancer OK''d Checklist" statuses.';

-- Test the updated function (optional - uncomment to test)
-- SELECT send_checklist_to_freelancer('00000000-0000-0000-0000-000000000000'); 