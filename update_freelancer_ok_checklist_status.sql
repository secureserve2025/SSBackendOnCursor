-- Update project status from "Freelancer Ok2 Checklist" to "Freelancer OK Checklist"
-- This addresses the VARCHAR(25) length constraint issue

-- 1. Update existing projects with the old status
UPDATE projects 
SET project_status_workflow = 'Freelancer OK Checklist'
WHERE project_status_workflow = 'Freelancer Ok2 Checklist';

-- 2. Drop and re-add the CHECK constraint with the new status
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_status_workflow_check;

ALTER TABLE projects ADD CONSTRAINT projects_project_status_workflow_check 
CHECK (project_status_workflow IN (
    'Project Created',
    'Assigned to Freelancer', 
    'Checklist Signed off',
    'Freelancer OK Checklist', -- Updated here
    'Fund Secured',
    'Production in Progress',
    'AI Verified',
    'Under Manual Revision',
    'Successfully Closed',
    'Product Rejected'
));

-- 3. Update the update_project_status_workflow function
CREATE OR REPLACE FUNCTION update_project_status_workflow(
    project_id UUID,
    new_status VARCHAR(25)
) RETURNS JSON AS $$
DECLARE
    current_status VARCHAR(25);
    result JSON;
BEGIN
    -- Get current status
    SELECT project_status_workflow INTO current_status
    FROM projects WHERE id = project_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Project not found');
    END IF;
    
    -- Validate the new status
    IF new_status NOT IN (
        'Project Created',
        'Assigned to Freelancer',
        'Checklist Signed off',
        'Freelancer OK Checklist', -- Updated here
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ) THEN
        RETURN json_build_object('success', false, 'message', 'Invalid status: ' || new_status);
    END IF;
    
    -- Update the project status
    UPDATE projects 
    SET project_status_workflow = new_status,
        updated_at = NOW()
    WHERE id = project_id;
    
    -- Return success
    RETURN json_build_object('success', true, 'message', 'Project status updated successfully');
END;
$$ LANGUAGE plpgsql;

-- 4. Update the get_valid_workflow_statuses function
CREATE OR REPLACE FUNCTION get_valid_workflow_statuses()
RETURNS TABLE(status_value VARCHAR(25)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'Project Created'::VARCHAR(25),
        'Assigned to Freelancer'::VARCHAR(25),
        'Checklist Signed off'::VARCHAR(25),
        'Freelancer OK Checklist'::VARCHAR(25), -- Updated here
        'Fund Secured'::VARCHAR(25),
        'Production in Progress'::VARCHAR(25),
        'AI Verified'::VARCHAR(25),
        'Under Manual Revision'::VARCHAR(25),
        'Successfully Closed'::VARCHAR(25),
        'Product Rejected'::VARCHAR(25)
    ]);
END;
$$ LANGUAGE plpgsql;

-- 5. Update comments
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 
'Updates project status workflow. Valid statuses: Project Created, Assigned to Freelancer, Checklist Signed off, Freelancer OK Checklist, Fund Secured, Production in Progress, AI Verified, Under Manual Revision, Successfully Closed, Product Rejected';

-- 6. Test the update
DO $$
DECLARE
    test_result JSON;
BEGIN
    -- Test the function with the new status
    SELECT update_project_status_workflow('00000000-0000-0000-0000-000000000000', 'Freelancer OK Checklist') INTO test_result;
    
    RAISE NOTICE 'Test result: %', test_result;
    
    -- Test getting valid statuses
    RAISE NOTICE 'Valid statuses:';
    FOR status_rec IN SELECT * FROM get_valid_workflow_statuses() LOOP
        RAISE NOTICE '  - %', status_rec.status_value;
    END LOOP;
END $$; 