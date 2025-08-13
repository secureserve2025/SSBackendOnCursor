-- Database Schema Diagnostic Script
-- This script will check what's actually in your database to understand the current state

-- ===========================================
-- PART 1: CHECK EXISTING TABLES
-- ===========================================

-- 1. Check all tables in the database
SELECT 
    'All Tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check projects table structure specifically
SELECT 
    'Projects Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check freelancer_profiles table structure
SELECT 
    'Freelancer Profiles Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check client_profiles table structure
SELECT 
    'Client Profiles Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'client_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check work_products table structure (if it exists)
SELECT 
    'Work Products Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'work_products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- PART 2: CHECK EXISTING RLS POLICIES
-- ===========================================

-- 6. Check RLS status for all tables
SELECT 
    'RLS Status' as info,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('projects', 'freelancer_profiles', 'client_profiles', 'work_products')
ORDER BY tablename;

-- 7. Check existing policies on projects table
SELECT 
    'Projects Table Policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- 8. Check existing policies on work_products table
SELECT 
    'Work Products Table Policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 9. Check existing policies on freelancer_profiles table
SELECT 
    'Freelancer Profiles Table Policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancer_profiles'
ORDER BY policyname;

-- 10. Check existing policies on client_profiles table
SELECT 
    'Client Profiles Table Policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'client_profiles'
ORDER BY policyname;

-- ===========================================
-- PART 3: CHECK SAMPLE DATA
-- ===========================================

-- 11. Check sample data in projects table
SELECT 
    'Sample Projects Data' as info,
    id,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status
FROM projects 
LIMIT 5;

-- 12. Check sample data in freelancer_profiles table
SELECT 
    'Sample Freelancer Profiles Data' as info,
    id,
    user_id,
    freelancer_id,
    full_name,
    email
FROM freelancer_profiles 
LIMIT 5;

-- 13. Check sample data in client_profiles table
SELECT 
    'Sample Client Profiles Data' as info,
    id,
    user_id,
    client_id,
    full_name,
    email
FROM client_profiles 
LIMIT 5;

-- 14. Check sample data in work_products table (if it exists)
SELECT 
    'Sample Work Products Data' as info,
    id,
    project_id,
    file_name,
    upload_status
FROM work_products 
LIMIT 5;

-- ===========================================
-- PART 4: CHECK FOREIGN KEY RELATIONSHIPS
-- ===========================================

-- 15. Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('projects', 'work_products')
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- PART 5: CHECK STORAGE BUCKETS
-- ===========================================

-- 16. Check storage buckets
SELECT 
    'Storage Buckets' as info,
    name as bucket_name,
    public as is_public
FROM storage.buckets 
ORDER BY name;

-- 17. Check storage policies
SELECT 
    'Storage Policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%work%'
ORDER BY policyname;

-- ===========================================
-- PART 6: CURRENT USER CONTEXT
-- ===========================================

-- 18. Check current user authentication
SELECT 
    'Current User Context' as info,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT AUTHENTICATED'
    END as auth_status;

-- 19. Check if current user has profiles
SELECT 
    'Current User Profiles' as info,
    'Freelancer Profile' as profile_type,
    fp.user_id,
    fp.freelancer_id,
    fp.full_name
FROM freelancer_profiles fp
WHERE fp.user_id = auth.uid()
UNION ALL
SELECT 
    'Current User Profiles' as info,
    'Client Profile' as profile_type,
    cp.user_id,
    cp.client_id,
    cp.full_name
FROM client_profiles cp
WHERE cp.user_id = auth.uid();

-- ===========================================
-- PART 7: SUMMARY
-- ===========================================

SELECT 'Database Schema Diagnostic Complete' as status;

