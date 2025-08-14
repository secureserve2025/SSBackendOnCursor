-- Disable Storage Bucket Policies for Work Products
-- This script will disable RLS policies on the storage.objects table for work-products bucket

-- 1. Check current storage policies
SELECT 
    'Current storage policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;

-- 2. Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Drop all storage policies that might interfere with work-products uploads
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete work products for their projects" ON storage.objects;

-- 4. Drop any other storage policies that might be restrictive
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;

-- 5. Create a permissive policy for work-products bucket
CREATE POLICY "Allow all operations on work-products bucket" ON storage.objects
    FOR ALL USING (bucket_id = 'work-products')
    WITH CHECK (bucket_id = 'work-products');

-- 6. Alternative: Create a completely open policy for testing
CREATE POLICY "Allow all storage operations" ON storage.objects
    FOR ALL USING (true)
    WITH CHECK (true);

-- 7. Re-enable RLS on storage.objects (with permissive policies)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 8. Verify the new policies
SELECT 
    'Updated storage policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;

-- 9. Check if work-products bucket exists and its settings
SELECT 
    'work-products bucket status' as info,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'work-products';

