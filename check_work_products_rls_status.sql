-- Check RLS Status for Work Products Table and Storage
-- This script will diagnose why uploads are still failing

-- 1. Check if work_products table exists and its RLS status
SELECT 
    'work_products table status' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'work_products';

-- 2. Check if work_products table exists in information_schema
SELECT 
    'work_products table exists' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'work_products';

-- 3. Check RLS policies on work_products table
SELECT 
    'work_products RLS policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 4. Check storage bucket policies for work-products
SELECT 
    'storage bucket policies' as info,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'work-products';

-- 5. Check storage bucket RLS policies
SELECT 
    'storage bucket RLS policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%work-products%';

-- 6. Check all storage policies
SELECT 
    'all storage policies' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;

-- 7. Force disable RLS on work_products if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products') THEN
        ALTER TABLE work_products DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on work_products table';
    ELSE
        RAISE NOTICE 'work_products table does not exist';
    END IF;
END $$;

-- 8. Drop any remaining policies on work_products
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can delete work products for their projects" ON work_products;

-- 9. Final check - verify work_products RLS is disabled
SELECT 
    'Final work_products RLS status' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'work_products';

