-- Remove file upload feature completely
-- This will clean up the project_files table and storage buckets

-- 1. Drop the project_files table (it's empty, so safe to remove)
DROP TABLE IF EXISTS project_files CASCADE;

-- 2. Delete storage buckets (this will also delete any files in them)
DELETE FROM storage.objects WHERE bucket_id = 'project-files';
DELETE FROM storage.objects WHERE bucket_id = 'project-documents';
DELETE FROM storage.buckets WHERE id = 'project-files';
DELETE FROM storage.buckets WHERE id = 'project-documents';

-- 3. Increase project_requirement field length to 500 characters
ALTER TABLE projects 
ALTER COLUMN project_requirement TYPE VARCHAR(500);

-- 4. Verify the changes
-- Check if project_files table is gone
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_name = 'project_files';

-- Check if storage buckets are gone
SELECT 
    id,
    name
FROM storage.buckets 
WHERE id IN ('project-files', 'project-documents');

-- Check project_requirement field length
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'project_requirement';

-- 5. Show current project count
SELECT COUNT(*) as total_projects FROM projects;

