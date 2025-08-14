-- Remove RLS policies from project_files table
-- These policies are blocking database inserts even though RLS is disabled

-- 1. Drop all RLS policies on project_files table
DROP POLICY IF EXISTS "Users can delete files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can update files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can upload files for their projects" ON project_files;
DROP POLICY IF EXISTS "Users can view files for their projects" ON project_files;

-- 2. Verify RLS is disabled on project_files table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'project_files'
ORDER BY tablename;

-- 3. Check if any policies remain
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'project_files'
ORDER BY policyname;

-- 4. Test if we can insert a test record
DO $$
DECLARE
    test_project_id UUID;
    test_insert_id UUID;
BEGIN
    -- Get a project ID for testing
    SELECT id INTO test_project_id 
    FROM projects 
    WHERE client_id = auth.uid() 
    LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        RAISE NOTICE 'Found test project: %', test_project_id;
        
        -- Try to insert a test record
        INSERT INTO project_files (
            project_id,
            file_name,
            file_path,
            file_size,
            file_type,
            storage_bucket
        ) VALUES (
            test_project_id,
            'test-file.pdf',
            'test/path/test-file.pdf',
            1024,
            'application/pdf',
            'project-documents'
        ) RETURNING id INTO test_insert_id;
        
        RAISE NOTICE 'Test insert successful! Inserted ID: %', test_insert_id;
        
        -- Clean up the test record
        DELETE FROM project_files WHERE id = test_insert_id;
        RAISE NOTICE 'Test record cleaned up successfully';
        
    ELSE
        RAISE NOTICE 'No projects found for current user: %', auth.uid();
    END IF;
END $$;

-- 5. Show current file counts
SELECT 
    'work_products' as table_name,
    COUNT(*) as file_count
FROM work_products
UNION ALL
SELECT 
    'verification_reports' as table_name,
    COUNT(*) as file_count
FROM verification_reports
UNION ALL
SELECT 
    'project_files' as table_name,
    COUNT(*) as file_count
FROM project_files;

