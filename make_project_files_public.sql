-- Make project-files bucket public like work-products
-- This is the simplest fix since you don't want RLS restrictions

-- 1. Make the project-files bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'project-files';

-- 2. Verify the change
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'project-files';

-- 3. Test if we can insert a test record (database should work now)
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

-- 4. Show current file counts
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
