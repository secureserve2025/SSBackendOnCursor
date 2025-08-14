-- Simple check: Does project_files table have any data?

-- 1. Count total files in project_files table
SELECT COUNT(*) as total_files FROM project_files;

-- 2. If no files, show the table is empty
SELECT 'Table exists but is empty' as status 
WHERE NOT EXISTS (SELECT 1 FROM project_files LIMIT 1);

-- 3. Check if RLS policies exist
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'project_files';

-- 4. Check recent projects that should have files
SELECT 
    p.id as project_id,
    p.project_name,
    p.created_at
FROM projects p
WHERE p.created_at >= '2025-07-30'
ORDER BY p.created_at DESC 
LIMIT 5;

