-- Check how work_products and verification_reports handle file uploads
-- This will help us make project_files work the same way

-- 1. Check work_products table structure and policies
SELECT 
    'work_products' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_products' 
ORDER BY ordinal_position;

-- 2. Check work_products RLS policies
SELECT 
    'work_products' as table_name,
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 3. Check verification_reports table structure and policies
SELECT 
    'verification_reports' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
ORDER BY ordinal_position;

-- 4. Check verification_reports RLS policies
SELECT 
    'verification_reports' as table_name,
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- 5. Check if these tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('work_products', 'verification_reports', 'project_files')
ORDER BY tablename;

-- 6. Check storage buckets used by these tables
SELECT DISTINCT
    storage_bucket
FROM work_products
WHERE storage_bucket IS NOT NULL
UNION
SELECT DISTINCT
    storage_bucket
FROM verification_reports
WHERE storage_bucket IS NOT NULL
UNION
SELECT DISTINCT
    storage_bucket
FROM project_files
WHERE storage_bucket IS NOT NULL;

-- 7. Check recent files in work_products and verification_reports
SELECT 
    'work_products' as source,
    COUNT(*) as file_count
FROM work_products
UNION ALL
SELECT 
    'verification_reports' as source,
    COUNT(*) as file_count
FROM verification_reports
UNION ALL
SELECT 
    'project_files' as source,
    COUNT(*) as file_count
FROM project_files;
