-- Fix RLS policies for project_files table
-- This will ensure users can insert file metadata

-- 1. First, let's see what policies exist
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'project_files';

-- 2. Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can upload files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can update files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can delete files for their projects" ON project_files;

-- 3. Create new policies with proper permissions
-- Users can view files for their projects
CREATE POLICY "Users can view files for their projects" ON project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()
        )
    );

-- Users can upload files for their projects (INSERT)
CREATE POLICY "Users can upload files for their projects" ON project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()
        )
    );

-- Users can update files for their projects
CREATE POLICY "Users can update files for their projects" ON project_files
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()
        )
    );

-- Users can delete files for their projects
CREATE POLICY "Users can delete files for their projects" ON project_files
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()
        )
    );

-- 4. Verify the policies were created
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'project_files'
ORDER BY policyname;

-- 5. Test if we can insert a test record (this will help identify any remaining issues)
-- Note: This will only work if you're authenticated as a user who owns a project
DO $$
DECLARE
    test_project_id UUID;
BEGIN
    -- Get a project ID for testing
    SELECT id INTO test_project_id 
    FROM projects 
    WHERE client_id = auth.uid() 
    LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        RAISE NOTICE 'Found test project: %', test_project_id;
        RAISE NOTICE 'Current user: %', auth.uid();
    ELSE
        RAISE NOTICE 'No projects found for current user: %', auth.uid();
    END IF;
END $$;

