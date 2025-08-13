-- Update Project Name Field Length to 30 Characters
-- This script updates the projects table to allow project names up to 30 characters
-- while maintaining the minimum 3 character requirement

-- Step 1: Drop the existing constraint that limits project_name to 20 characters
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_name_length;

-- Step 2: Check if there's a constraint built into the column definition
-- and remove any inline CHECK constraints if they exist
DO $$
BEGIN
    -- Try to remove any column-level constraints by recreating the column
    -- First check if we need to modify the column type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'project_name' 
        AND character_maximum_length < 30
    ) THEN
        -- Modify the column to allow up to 30 characters
        ALTER TABLE projects ALTER COLUMN project_name TYPE VARCHAR(30);
        RAISE NOTICE 'Updated project_name column to VARCHAR(30)';
    END IF;
END $$;

-- Step 3: Add the new constraint with updated length limit (3 to 30 characters)
ALTER TABLE projects 
ADD CONSTRAINT check_project_name_length 
CHECK (LENGTH(project_name) >= 3 AND LENGTH(project_name) <= 30);

-- Step 4: Verify the change
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'project_name';

-- Step 5: Show the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND conname = 'check_project_name_length';

-- Success message
SELECT 'Project name field successfully updated to allow 3-30 characters' as status;

