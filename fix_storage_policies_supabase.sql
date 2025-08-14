-- Fix Storage Policies for Work Products - Supabase Compatible
-- This script creates permissive policies for the work-products bucket

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

-- 2. Drop any existing restrictive policies for work-products
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete work products for their projects" ON storage.objects;

-- 3. Create a permissive policy for work-products bucket
-- This allows any authenticated user to upload to work-products bucket
CREATE POLICY "Allow authenticated users to upload work products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 4. Create a permissive policy for viewing work products
CREATE POLICY "Allow authenticated users to view work products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 5. Create a permissive policy for updating work products
CREATE POLICY "Allow authenticated users to update work products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 6. Create a permissive policy for deleting work products
CREATE POLICY "Allow authenticated users to delete work products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 7. Alternative: Create a completely open policy for work-products bucket
-- This is the most permissive approach for testing
CREATE POLICY "Open access to work-products bucket" ON storage.objects
    FOR ALL USING (bucket_id = 'work-products')
    WITH CHECK (bucket_id = 'work-products');

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

-- 10. Test if we can access the bucket
SELECT 
    'Bucket access test' as info,
    name as bucket_name,
    public as is_public
FROM storage.buckets 
WHERE name = 'work-products';

