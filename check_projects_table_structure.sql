-- Check Projects Table Structure and Client ID Relationship
-- This script helps diagnose the Client ID display issue in Freelancer Dashboard

-- 1. Check the current structure of the projects table
SELECT 
    'Projects Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Check the current structure of client_profiles table
SELECT 
    'Client Profiles Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'client_profiles'
ORDER BY ordinal_position;

-- 3. Check foreign key relationships for projects table
SELECT 
    'Projects Foreign Keys' as check_type,
    tc.constraint_name,
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
AND tc.table_name = 'projects';

-- 4. Check sample data from projects table
SELECT 
    'Sample Projects Data' as check_type,
    id,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
LIMIT 5;

-- 5. Check sample data from client_profiles table
SELECT 
    'Sample Client Profiles Data' as check_type,
    id,
    user_id,
    client_id,
    full_name,
    email,
    created_at
FROM client_profiles 
LIMIT 5;

-- 6. Test the relationship between projects.client_id and client_profiles
SELECT 
    'Client ID Relationship Test' as check_type,
    p.id as project_id,
    p.project_id as project_display_id,
    p.client_id as project_client_id,
    cp.id as client_profile_id,
    cp.user_id as client_user_id,
    cp.client_id as client_display_id,
    cp.full_name as client_name,
    CASE 
        WHEN p.client_id = cp.id THEN 'UUID to UUID (id)'
        WHEN p.client_id = cp.user_id THEN 'UUID to UUID (user_id)'
        WHEN p.client_id = cp.client_id THEN 'UUID to VARCHAR (client_id)'
        ELSE 'No match'
    END as relationship_type
FROM projects p
LEFT JOIN client_profiles cp ON (
    p.client_id = cp.id OR 
    p.client_id = cp.user_id OR 
    p.client_id = cp.client_id
)
LIMIT 10;

-- 7. Check if RPC function exists
SELECT 
    'RPC Function Check' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_freelancer_projects_display';
