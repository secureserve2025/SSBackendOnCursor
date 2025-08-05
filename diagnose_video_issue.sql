-- Diagnostic script to debug video access issues
-- Run this in your Supabase SQL editor

-- 1. Check if work_products table has data
SELECT 'Work Products Table Check' as check_type;
SELECT 
    id,
    project_id,
    file_name,
    file_path,
    file_size,
    file_type,
    storage_bucket,
    created_at
FROM work_products 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check the specific project mentioned in the error
SELECT 'Specific Project Check' as check_type;
SELECT 
    p.id as project_id,
    p.project_id as project_code,
    p.project_name,
    p.project_status_workflow,
    p.client_id,
    p.freelancer_id,
    wp.id as work_product_id,
    wp.file_name,
    wp.file_path,
    wp.file_size,
    wp.storage_bucket
FROM projects p
LEFT JOIN work_products wp ON p.id = wp.project_id
WHERE p.id = '49f8f594-14c2-4996-9707-488bcfabdd43'
   OR p.project_id = '49f8f594-14c2-4996-9707-488bcfabdd43';

-- 3. Check all projects with work products
SELECT 'All Projects with Work Products' as check_type;
SELECT 
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    COUNT(wp.id) as work_product_count,
    STRING_AGG(wp.file_name, ', ') as file_names
FROM projects p
LEFT JOIN work_products wp ON p.id = wp.project_id
WHERE wp.id IS NOT NULL
GROUP BY p.id, p.project_id, p.project_name, p.project_status_workflow
ORDER BY p.created_at DESC;

-- 4. Check current storage policies
SELECT 'Current Storage Policies' as check_type;
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
AND (policyname LIKE '%work%' OR policyname LIKE '%verification%')
ORDER BY policyname;

-- 5. Check if work-products bucket exists and is public
SELECT 'Storage Bucket Check' as check_type;
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'work-products';

-- 6. Test the specific file path mentioned in the error
SELECT 'File Path Analysis' as check_type;
SELECT 
    'Expected path: 259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated File June 19, 2025 - 3_07PM.mp4' as file_path,
    'User ID: 259bc32e-b934-40ea-86c6-50bfb726528b' as user_id,
    'Project ID: 49f8f594-14c2-4996-9707-488bcfabdd43' as project_id,
    'Filename: Generated File June 19, 2025 - 3_07PM.mp4' as filename;

-- 7. Check if the user and project relationship exists
SELECT 'User-Project Relationship Check' as check_type;
SELECT 
    'Client Profile' as profile_type,
    cp.user_id,
    cp.full_name,
    p.id as project_id,
    p.project_id as project_code
FROM client_profiles cp
JOIN projects p ON cp.user_id = p.client_id
WHERE p.id = '49f8f594-14c2-4996-9707-488bcfabdd43'
   OR p.project_id = '49f8f594-14c2-4996-9707-488bcfabdd43'
UNION ALL
SELECT 
    'Freelancer Profile' as profile_type,
    fp.user_id,
    fp.full_name,
    p.id as project_id,
    p.project_id as project_code
FROM freelancer_profiles fp
JOIN projects p ON fp.freelancer_id = p.freelancer_id
WHERE p.id = '49f8f594-14c2-4996-9707-488bcfabdd43'
   OR p.project_id = '49f8f594-14c2-4996-9707-488bcfabdd43';

-- 8. Check RLS on work_products table
SELECT 'Work Products RLS Check' as check_type;
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
WHERE tablename = 'work_products' 
AND schemaname = 'public'
ORDER BY policyname; 