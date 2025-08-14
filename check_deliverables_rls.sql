-- Check deliverables table structure and RLS policies
-- Run this in Supabase SQL Editor

-- 1. Check deliverables table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on deliverables table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'deliverables';

-- 3. Check existing RLS policies on deliverables table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'deliverables';

-- 4. Test current user authentication
SELECT 
    'Current User Test' as test_type,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 5. Check if user can access any projects (to understand the JOIN logic)
SELECT 
    'User Projects Access Test' as test_type,
    COUNT(*) as projects_count
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE cp.user_id = auth.uid();











