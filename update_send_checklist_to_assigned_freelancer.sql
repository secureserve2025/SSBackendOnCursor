-- Update send_checklist_to_freelancer function to change status to "Assigned to Freelancer"
-- This script updates the function to change project status when client sends checklist to freelancer

-- Drop and recreate send_checklist_to_freelancer function
DROP FUNCTION IF EXISTS send_checklist_to_freelancer(UUID);

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
    
    -- Allow if current status is "Project Created"
    IF current_status NOT IN ('Project Created') THEN
        result := json_build_object('success', false, 'message', 'Can only send checklist when project status is "Project Created". Current status: ' || current_status);
        RETURN result;
    END IF;
    
    -- Update project status to "Assigned to Freelancer"
    UPDATE projects 
    SET 
        project_status_workflow = 'Assigned to Freelancer',
        updated_at = NOW()
    WHERE id = project_uuid;
    
    result := json_build_object('success', true, 'message', 'Checklist sent to freelancer successfully. Project status updated to "Assigned to Freelancer".');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the change
COMMENT ON FUNCTION send_checklist_to_freelancer(UUID) IS 'Sends the project checklist to the freelancer by updating status to "Assigned to Freelancer". Only works when project status is "Project Created".';

-- Test the function
DO $$
DECLARE
    test_project_id UUID;
    test_result JSON;
BEGIN
    -- Get a test project ID with "Project Created" status
    SELECT id INTO test_project_id 
    FROM projects 
    WHERE project_status_workflow = 'Project Created' 
    LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test the function
        SELECT send_checklist_to_freelancer(test_project_id) INTO test_result;
        
        IF test_result->>'success' = 'true' THEN
            RAISE NOTICE 'Test successful: Function can update project status to "Assigned to Freelancer"';
        ELSE
            RAISE NOTICE 'Test failed: %', test_result->>'message';
        END IF;
    ELSE
        RAISE NOTICE 'No projects with "Project Created" status found for testing';
    END IF;
END $$; 