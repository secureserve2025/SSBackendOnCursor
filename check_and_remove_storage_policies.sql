-- Check and remove storage policies that are blocking uploads
-- Even though the bucket is public, RLS policies on storage.objects can still block uploads

-- 1. Check all storage policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Check if there are any policies specifically for project-files bucket
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND (qual LIKE '%project-files%' OR with_check LIKE '%project-files%')
ORDER BY policyname;

-- 3. Check if there are any general storage policies that might be blocking
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND (qual LIKE '%bucket_id%' OR with_check LIKE '%bucket_id%')
ORDER BY policyname;

-- 4. Drop all storage policies that might be blocking project-files uploads
-- (This will remove any policies that restrict uploads to the project-files bucket)
DROP POLICY IF EXISTS "Users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project files" ON storage.objects;

-- 5. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 6. Verify bucket is still public
SELECT 
    id,
    name,
    public
FROM storage.buckets 
WHERE id = 'project-files';

