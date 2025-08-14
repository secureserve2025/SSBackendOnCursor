-- Final Test: Check if file upload system is working
-- Run this after setting up storage policies

-- 1. Check if storage bucket exists and has correct settings
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'project-files';

-- 2. Check if project_files table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position;

-- 3. Check if RLS policies exist on project_files table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'project_files';

-- 4. Check if storage policies exist (should show 4 policies)
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 5. Check recent projects (last 5)
SELECT 
    id,
    project_name,
    client_id,
    created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check if any files have been uploaded recently
SELECT 
    id,
    project_id,
    file_name,
    file_type,
    file_size,
    uploaded_at
FROM project_files 
ORDER BY uploaded_at DESC 
LIMIT 5;

-- 7. Test storage bucket access
SELECT 
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'project-files' 
ORDER BY created_at DESC 
LIMIT 5;

