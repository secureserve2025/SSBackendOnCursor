-- Check current storage policies
-- This will help us identify why storage upload is failing

-- 1. Check if storage policies exist
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Check the storage bucket settings
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'project-files';

-- 3. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Test the current user and their projects
SELECT 
    auth.uid() as current_user_id,
    COUNT(*) as user_projects_count
FROM projects 
WHERE client_id = auth.uid();

-- 5. Check if there are any existing files in storage for this user
SELECT 
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND owner = auth.uid()::text
ORDER BY created_at DESC 
LIMIT 5;
