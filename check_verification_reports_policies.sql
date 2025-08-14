-- Check what policies verification-reports has since it's private but works

-- 1. Check all storage policies for verification-reports bucket
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND (qual LIKE '%verification-reports%' OR with_check LIKE '%verification-reports%')
ORDER BY policyname;

-- 2. Check if verification-reports has any specific policies
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Check if verification-reports bucket has any files
SELECT 
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'verification-reports'
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if project-files bucket has any files
SELECT 
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'project-files'
ORDER BY created_at DESC 
LIMIT 5;

