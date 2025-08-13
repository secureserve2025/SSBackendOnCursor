-- Simple Diagnostic Script to Find the Display Issue
-- Run this in Supabase SQL Editor to identify the problem

-- 1. Check if the RPC functions exist
SELECT 
    'RPC Function Check' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('get_client_projects_display', 'get_freelancer_projects_display')
ORDER BY routine_name;

-- 2. Check if the required tables exist
SELECT 
    'Table Existence Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM (
    SELECT 'projects' as table_name
    UNION SELECT 'deliverables'
    UNION SELECT 'work_products'
    UNION SELECT 'verification_reports'
    UNION SELECT 'project_files'
    UNION SELECT 'project_status_history'
    UNION SELECT 'client_profiles'
    UNION SELECT 'freelancer_profiles'
) t
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = t.table_name
);

-- 3. Check projects table structure
SELECT 
    'Projects Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 4. Check if there are any projects in the database
SELECT 
    'Projects Count' as check_type,
    COUNT(*) as total_projects
FROM projects;

-- 5. Check if there are any client profiles
SELECT 
    'Client Profiles Count' as check_type,
    COUNT(*) as total_clients
FROM client_profiles;

-- 6. Check if there are any freelancer profiles
SELECT 
    'Freelancer Profiles Count' as check_type,
    COUNT(*) as total_freelancers
FROM freelancer_profiles;

-- 7. Check sample project data (if any exists)
SELECT 
    'Sample Project Data' as check_type,
    id,
    project_name,
    client_id,
    freelancer_id,
    project_status_workflow,
    created_at
FROM projects 
LIMIT 5;









