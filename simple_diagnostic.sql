-- Simple Database Diagnostic Script
-- This will help us understand what's actually in your database

-- 1. Check if tables exist
SELECT 'Checking if tables exist...' as status;

-- 2. List all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 3. Check if projects table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if freelancer_profiles table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if client_profiles table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check if work_products table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check RLS status for key tables
SELECT tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('projects', 'freelancer_profiles', 'client_profiles', 'work_products');

-- 8. Check if we can access the tables (simple count)
SELECT 'projects' as table_name, COUNT(*) as row_count FROM projects
UNION ALL
SELECT 'freelancer_profiles' as table_name, COUNT(*) as row_count FROM freelancer_profiles
UNION ALL
SELECT 'client_profiles' as table_name, COUNT(*) as row_count FROM client_profiles
UNION ALL
SELECT 'work_products' as table_name, COUNT(*) as row_count FROM work_products;

-- 9. Check current user
SELECT auth.uid() as current_user_id;

-- 10. Check storage buckets
SELECT name, public FROM storage.buckets;

