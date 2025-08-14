-- Fix work-products storage bucket file size limit
-- This script updates the file size limit to allow larger video uploads

-- 1. Update the work-products bucket to allow larger files (50MB limit)
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'work-products';

-- 2. Verify the update was successful
SELECT 
  id,
  name,
  public,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as file_size_limit_mb,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'work-products';

-- 3. Also update the uploadWorkProduct function to match the new limit
-- The function currently has a 50MB limit, which matches our new bucket limit

-- 4. Check current storage policies for work-products bucket
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%work%';

-- 5. Summary
SELECT 
  'Work-products bucket file size limit updated to 50MB' as status,
  'Video files up to 50MB can now be uploaded' as details;
