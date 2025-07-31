-- Test script to check if the projects table and related tables exist
-- Run this in your Supabase SQL Editor to verify the schema

-- Check if projects table exists
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'project_files', 'deliverables', 'client_profiles', 'freelancer_profiles');

-- Check projects table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_project_id', 'auto_assign_project_id', 'validate_freelancer_id', 'get_project_with_details');

-- Test the generate_project_id function
SELECT generate_project_id() as test_project_id;

-- Check if there are any existing projects
SELECT COUNT(*) as project_count FROM projects;

-- Check if there are any existing client profiles
SELECT COUNT(*) as client_count FROM client_profiles;

-- Check if there are any existing freelancer profiles
SELECT COUNT(*) as freelancer_count FROM freelancer_profiles; 