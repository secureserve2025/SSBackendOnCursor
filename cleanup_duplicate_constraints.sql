-- Clean up duplicate project name constraints
-- We have two constraints for project_name with different limits

-- 1. Drop the more restrictive constraint (3-20 characters)
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_project_name_check;

-- 2. Keep the less restrictive constraint (3-30 characters)
-- This allows for longer project names

-- 3. Verify the remaining constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c'
ORDER BY conname;
