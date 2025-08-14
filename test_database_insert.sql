-- Test if database inserts work for project_files table
-- This will help identify any remaining issues

-- 1. Check if we can insert a test record
-- (This will only work if you're authenticated and have a project)

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
        RAISE NOTICE 'Current user: %', auth.uid();
        
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
            'project-files'
        ) RETURNING id INTO test_insert_id;
        
        RAISE NOTICE 'Test insert successful! Inserted ID: %', test_insert_id;
        
        -- Clean up the test record
        DELETE FROM project_files WHERE id = test_insert_id;
        RAISE NOTICE 'Test record cleaned up successfully';
        
    ELSE
        RAISE NOTICE 'No projects found for current user: %', auth.uid();
    END IF;
END $$;

-- 2. Check current file count
SELECT COUNT(*) as current_file_count FROM project_files;
