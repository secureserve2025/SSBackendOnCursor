-- Fix Storage Policies for Work Products
-- This script ensures the storage bucket policies are correctly configured

-- 1. Check if the work-products bucket exists
SELECT 
    name as bucket_name,
    public as is_public
FROM storage.buckets 
WHERE name = 'work-products';

-- 2. Create the work-products bucket if it doesn't exist
INSERT INTO storage.buckets (name, public)
VALUES ('work-products', false)
ON CONFLICT (name) DO NOTHING;

-- 3. Drop existing storage policies for work-products bucket
DROP POLICY IF EXISTS "Users can upload work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their work products" ON storage.objects;

-- 4. Create new storage policies for work-products bucket
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload work products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' AND
        auth.uid() IS NOT NULL
    );

-- Allow authenticated users to view files in their own folder
CREATE POLICY "Users can view their work products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' AND
        auth.uid() IS NOT NULL
    );

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update their work products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' AND
        auth.uid() IS NOT NULL
    );

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete their work products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' AND
        auth.uid() IS NOT NULL
    );

-- 5. Verify the storage policies were created
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%work products%';

-- 6. Alternative: More restrictive policy based on folder structure
-- Uncomment this section if you want folder-based access control
/*
DROP POLICY IF EXISTS "Users can upload work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their work products" ON storage.objects;

CREATE POLICY "Users can upload work products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their work products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their work products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their work products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
*/ 