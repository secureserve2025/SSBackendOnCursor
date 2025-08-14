-- =============================================================================
-- DIAGNOSE MESSAGING ISSUE SCRIPT
-- This script checks the current database structure and identifies why messaging isn't working
-- =============================================================================

-- Check current projects table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- Check current freelancer_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'freelancer_profiles'
ORDER BY ordinal_position;

-- Check current client_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'client_profiles'
ORDER BY ordinal_position;

-- Check if there are any projects in the database
SELECT COUNT(*) as total_projects FROM projects;

-- Check if there are any freelancer profiles
SELECT COUNT(*) as total_freelancers FROM freelancer_profiles;

-- Check if there are any client profiles
SELECT COUNT(*) as total_clients FROM client_profiles;

-- Check sample projects to understand the data structure
SELECT 
    id,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
LIMIT 5;

-- Check sample freelancer profiles
SELECT 
    id,
    user_id,
    freelancer_id,
    full_name,
    email
FROM freelancer_profiles 
LIMIT 5;

-- Check sample client profiles
SELECT 
    id,
    user_id,
    client_id,
    full_name,
    email
FROM client_profiles 
LIMIT 5;

-- Check if there are any projects with "Checklist Signed off" status
SELECT 
    id,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status_workflow
FROM projects 
WHERE project_status_workflow = 'Checklist Signed off';

-- Check if there are any projects assigned to freelancers
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    fp.full_name as freelancer_name,
    fp.freelancer_id as freelancer_display_id
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.freelancer_id IS NOT NULL
LIMIT 10;

-- Check if there are any projects assigned to clients
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.client_id,
    cp.full_name as client_name,
    cp.client_id as client_display_id
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.client_id IS NOT NULL
LIMIT 10;

-- Check RLS status on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'freelancer_profiles', 'client_profiles', 'messages')
ORDER BY tablename;

-- Check if there are any RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('projects', 'freelancer_profiles', 'client_profiles', 'messages')
ORDER BY tablename, policyname;
