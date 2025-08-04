-- Update send_checklist_to_freelancer function to NOT change project status
-- The button should only control visibility, not change the project status

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

    -- Don't change the project status - just return success
    -- The visibility is controlled by the frontend filtering logic
    -- This function now just validates that the action is allowed
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the comment to reflect the new functionality
COMMENT ON FUNCTION send_checklist_to_freelancer(UUID) IS 'Validates that checklist can be sent to freelancer. Does not change project status - visibility is controlled by frontend logic.'; 