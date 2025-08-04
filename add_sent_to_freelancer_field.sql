-- Add a new field to track which projects have been sent to freelancers
-- This allows us to control visibility without changing project status

-- Add the new field
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS sent_to_freelancer BOOLEAN DEFAULT FALSE;

-- Update the send_checklist_to_freelancer function to set this field
CREATE OR REPLACE FUNCTION send_checklist_to_freelancer(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
    project_exists BOOLEAN;
    current_status VARCHAR(50);
    already_sent BOOLEAN;
    result JSON;
BEGIN
    -- Check if project exists
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid) INTO project_exists;
    
    IF NOT project_exists THEN
        result := json_build_object('success', false, 'message', 'Project with ID ' || project_uuid || ' does not exist');
        RETURN result;
    END IF;

    -- Get current status and sent_to_freelancer flag
    SELECT project_status_workflow, sent_to_freelancer 
    INTO current_status, already_sent 
    FROM projects 
    WHERE id = project_uuid;
    
    -- Check if already sent to freelancer
    IF already_sent THEN
        result := json_build_object('success', true, 'message', 'Project is already visible to freelancer', 'already_sent', true);
        RETURN result;
    END IF;
    
    -- Allow if current status is "Project Created" OR "Freelancer OK Checklist"
IF current_status NOT IN ('Project Created', 'Freelancer OK Checklist') THEN
result := json_build_object('success', false, 'message', 'Can only send checklist when project status is "Project Created" or "Freelancer OK Checklist". Current status: ' || current_status);
        RETURN result;
    END IF;

    -- Set the sent_to_freelancer flag to TRUE
    UPDATE projects 
    SET 
        sent_to_freelancer = TRUE,
        updated_at = NOW()
    WHERE id = project_uuid;
    
    result := json_build_object('success', true, 'message', 'Project is now visible to freelancer', 'already_sent', false);
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the comment to reflect the new functionality
COMMENT ON FUNCTION send_checklist_to_freelancer(UUID) IS 'Marks a project as sent to freelancer by setting sent_to_freelancer flag to TRUE. Returns JSON with success status and message. Does not change project status.';

-- Add comment to the new column
COMMENT ON COLUMN projects.sent_to_freelancer IS 'Boolean flag indicating if the project has been sent to the freelancer for review'; 