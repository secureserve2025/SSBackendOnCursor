-- Simple Storage Fix for Work Products
-- This script creates basic policies that allow authenticated users to upload work products

-- 1. First, let's see what storage policies currently exist
SELECT 
    'Current storage policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;

-- 2. Drop any existing work-products policies that might be causing issues
DROP POLICY IF EXISTS "Freelancers can upload work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can update work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can delete work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload work products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view work products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update work products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete work products" ON storage.objects;
DROP POLICY IF EXISTS "Open access to work-products bucket" ON storage.objects;

-- 3. Create a simple policy that allows any authenticated user to upload to work-products bucket
CREATE POLICY "Allow uploads to work-products bucket" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 4. Create a simple policy that allows any authenticated user to view work-products
CREATE POLICY "Allow viewing work-products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 5. Create a simple policy that allows any authenticated user to update work-products
CREATE POLICY "Allow updating work-products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 6. Create a simple policy that allows any authenticated user to delete work-products
CREATE POLICY "Allow deleting work-products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
    );

-- 7. Verify the new policies were created
SELECT 
    'New work-products policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND policyname LIKE '%work%'
ORDER BY policyname;

-- 8. Check if work-products bucket exists
SELECT 
    'work-products bucket status' as info,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'work-products';

-- 9. Test if current user is authenticated
SELECT 
    'Authentication test' as info,
    auth.uid() as current_user_id,
    auth.role() as user_role;


