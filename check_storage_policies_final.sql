-- Check all storage policies that might be blocking uploads
-- This will help us identify what's still blocking the storage upload

-- 1. Check all storage policies on storage.objects
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Check the project-documents bucket settings
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'project-documents';

-- 4. Check if there are any files in the project-documents bucket
SELECT 
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'project-documents' 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check if there are any general storage policies that might be blocking
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND (qual LIKE '%bucket_id%' OR with_check LIKE '%bucket_id%' OR qual LIKE '%auth%' OR with_check LIKE '%auth%')
ORDER BY policyname;
