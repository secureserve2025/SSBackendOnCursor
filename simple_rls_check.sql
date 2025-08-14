-- Simple check: RLS status and policies for file tables

-- 1. Check RLS status for all file tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('work_products', 'verification_reports', 'project_files')
ORDER BY tablename;

-- 2. Check policies for work_products
SELECT 
    'work_products' as table_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 3. Check policies for verification_reports
SELECT 
    'verification_reports' as table_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- 4. Check policies for project_files
SELECT 
    'project_files' as table_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'project_files'
ORDER BY policyname;

-- 5. Check storage buckets used
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

