-- Check if files are being saved to project_files table
-- This will help us identify if the issue is with database saving

-- 1. Check if project_files table exists and has data
SELECT 
    COUNT(*) as total_files,
    COUNT(DISTINCT project_id) as unique_projects
FROM project_files;

-- 2. Check recent files in project_files table
SELECT 
    id,
    project_id,
    file_name,
    file_type,
    file_size,
    uploaded_at,
    created_at
FROM project_files 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if there are any projects without files
SELECT 
    p.id as project_id,
    p.project_name,
    p.created_at as project_created,
    COUNT(pf.id) as file_count
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
WHERE p.created_at >= '2025-07-30'
GROUP BY p.id, p.project_name, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Check RLS policies on project_files table
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'project_files';

-- 5. Check if the table structure is correct
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position;

