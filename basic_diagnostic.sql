-- Basic Database Diagnostic Script
-- This will definitely show us what's in your database

-- 1. List all tables in the database
SELECT 'All Tables in Database:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if specific tables exist
SELECT 'Checking specific tables:' as info;
SELECT 
    'projects' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'freelancer_profiles' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'client_profiles' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'work_products' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products' AND table_schema = 'public') as exists;

-- 3. Check storage buckets
SELECT 'Storage Buckets:' as info;
SELECT name, public FROM storage.buckets ORDER BY name;

