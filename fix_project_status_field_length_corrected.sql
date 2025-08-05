-- Fix project_status_workflow field length to accommodate longer status values
-- This script handles the view dependency by dropping and recreating the view with correct joins

-- 1. First, drop the dependent view
DROP VIEW IF EXISTS project_summary_extended;

-- 2. Alter the column to increase its length
ALTER TABLE projects 
ALTER COLUMN project_status_workflow TYPE VARCHAR(50);

-- 3. Recreate the view with correct joins
CREATE OR REPLACE VIEW project_summary_extended AS
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_category,
    p.project_status_workflow,
    p.desired_completion_date,
    p.created_at,
    p.updated_at,
    cp.full_name as client_name,
    cp.email as client_email,
    fp.full_name as freelancer_name,
    fp.email as freelancer_email,
    COUNT(DISTINCT pf.id) as file_count,
    COUNT(DISTINCT d.id) as deliverable_count
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.user_id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
LEFT JOIN project_files pf ON p.id = pf.project_id
LEFT JOIN deliverables d ON p.id = d.project_id
GROUP BY p.id, p.project_id, p.project_name, p.project_category, p.project_status_workflow, 
         p.desired_completion_date, p.created_at, p.updated_at, cp.full_name, cp.email, 
         fp.full_name, fp.email;

-- 4. Update the CHECK constraint to include all valid statuses
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

-- 5. Update the function to accept VARCHAR(50)
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

-- 6. Test the function
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