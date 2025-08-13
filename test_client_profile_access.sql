-- Test Client Profile Access
-- This script tests if we can access the specific client profile

-- 1. Test direct access to the specific client profile
SELECT 
    'Direct Client Profile Access' as test_type,
    id,
    client_id,
    full_name,
    email
FROM client_profiles 
WHERE id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4';

-- 2. Test if we can access any client profiles
SELECT 
    'All Client Profiles Access Test' as test_type,
    COUNT(*) as total_profiles,
    STRING_AGG(client_id, ', ') as all_client_ids
FROM client_profiles;

-- 3. Test the specific project-client relationship
SELECT 
    'Project-Client Relationship Test' as test_type,
    p.project_id,
    p.client_id as project_client_uuid,
    cp.id as client_profile_uuid,
    cp.client_id as client_display_id,
    cp.full_name as client_name
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.project_id = 'V1002';

-- 4. Check RLS policies on client_profiles table
SELECT 
    'RLS Policies Check' as test_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'client_profiles';

