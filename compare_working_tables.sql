-- Compare working tables (work_products, verification_reports) with project_files
-- This will help us understand what's different

-- 1. Check which storage buckets exist
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
ORDER BY name;

-- 2. Check if work_products and verification_reports use different buckets
SELECT 
    'work_products' as table_name,
    storage_bucket,
    COUNT(*) as file_count
FROM work_products
GROUP BY storage_bucket
UNION ALL
SELECT 
    'verification_reports' as table_name,
    storage_bucket,
    COUNT(*) as file_count
FROM verification_reports
GROUP BY storage_bucket
UNION ALL
SELECT 
    'project_files' as table_name,
    storage_bucket,
    COUNT(*) as file_count
FROM project_files
GROUP BY storage_bucket;

-- 3. Check if the working buckets have any storage policies
SELECT 
    'work-products bucket policies' as bucket_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND qual LIKE '%work-products%'
ORDER BY policyname;

SELECT 
    'verification-reports bucket policies' as bucket_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND qual LIKE '%verification-reports%'
ORDER BY policyname;

SELECT 
    'project-files bucket policies' as bucket_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND qual LIKE '%project-files%'
ORDER BY policyname;

-- 4. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 5. Check if the working buckets are public
SELECT 
    id,
    name,
    public
FROM storage.buckets 
WHERE name IN ('work-products', 'verification-reports', 'project-files');
