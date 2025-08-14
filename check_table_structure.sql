-- Check table structure and data types
-- This will help us understand the correct data types for RLS policies

-- 1. Check projects table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- 2. Check client_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_profiles' 
ORDER BY ordinal_position;

-- 3. Check freelancer_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 4. Check if project_files table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position;

-- 5. Check sample data from projects table
SELECT 
    id,
    client_id,
    freelancer_id,
    project_name,
    created_at
FROM projects 
LIMIT 3;

-- 6. Check sample data from client_profiles table
SELECT 
    id,
    user_id,
    full_name,
    created_at
FROM client_profiles 
LIMIT 3;

-- 7. Check sample data from freelancer_profiles table
SELECT 
    id,
    user_id,
    freelancer_id,
    full_name,
    created_at
FROM freelancer_profiles 
LIMIT 3;

