-- Create a new bucket for project files that should work without RLS issues
-- This is an alternative if we can't disable RLS on storage.objects

-- 1. Create a new bucket with a different name
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-documents',
    'project-documents',
    true, -- Make it public from the start
    5242880, -- 5MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Update the project_files table to use the new bucket
ALTER TABLE project_files 
ALTER COLUMN storage_bucket SET DEFAULT 'project-documents';

-- 3. Verify the new bucket was created
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'project-documents';

-- 4. Test if we can insert a test record with the new bucket
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
        
        -- Try to insert a test record with new bucket
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

