-- Fix the project_requirement check constraint
-- The old constraint is still enforcing 200 characters even though we changed the field type

-- 1. First, let's see what constraints exist on the projects table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c';

-- 2. Drop the old check constraint if it exists
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_project_requirement_check;

-- 3. Create a new check constraint for 500 characters
ALTER TABLE projects 
ADD CONSTRAINT projects_project_requirement_check 
CHECK (length(project_requirement) >= 10 AND length(project_requirement) <= 500);

-- 4. Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c';

-- 5. Test the constraint with a long string
DO $$
BEGIN
    -- Test with a string that's exactly 500 characters
    INSERT INTO projects (
        client_id, 
        freelancer_id, 
        project_category, 
        project_name, 
        project_requirement,
        desired_completion_date,
        project_status
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'Test',
        'Test Project',
        repeat('A', 500), -- Exactly 500 characters
        '2025-12-31',
        'Draft'
    );
    
    -- Clean up the test record
    DELETE FROM projects WHERE project_name = 'Test Project';
    
    RAISE NOTICE 'Constraint test passed - 500 character string accepted';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint test failed: %', SQLERRM;
END $$;

