-- Debug Client ID Issue
-- This script tests the exact relationship that should be working

-- 1. Test the specific project that's showing UUID
SELECT 
    'Debug Project Client ID' as test_type,
    p.id as project_uuid,
    p.project_id as project_display_id,
    p.client_id as project_client_uuid,
    cp.id as client_profile_uuid,
    cp.client_id as client_display_id,
    cp.full_name as client_name,
    CASE 
        WHEN p.client_id = cp.id THEN '✅ MATCH: UUID to UUID'
        ELSE '❌ NO MATCH'
    END as relationship_status
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.project_id IN ('V1002', 'V1003')  -- Test the specific projects
ORDER BY p.project_id;

-- 2. Test all projects to see which ones have issues
SELECT 
    'All Projects Client ID Check' as test_type,
    p.project_id,
    p.client_id as project_client_uuid,
    cp.client_id as client_display_id,
    CASE 
        WHEN cp.client_id IS NULL THEN '❌ MISSING CLIENT PROFILE'
        WHEN p.client_id = cp.id THEN '✅ CORRECT RELATIONSHIP'
        ELSE '❌ WRONG RELATIONSHIP'
    END as status
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.project_status_workflow != 'Project Created'
ORDER BY p.created_at DESC;

-- 3. Check if there are any client profiles with the UUID that's being displayed
SELECT 
    'Client Profile UUID Check' as test_type,
    id as profile_uuid,
    client_id as display_id,
    full_name,
    email
FROM client_profiles 
WHERE id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'  -- The UUID that's being displayed
   OR client_id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4';

-- 4. Check all client profiles to see the mapping
SELECT 
    'All Client Profiles' as test_type,
    id as profile_uuid,
    client_id as display_id,
    full_name,
    email
FROM client_profiles 
ORDER BY created_at DESC;

