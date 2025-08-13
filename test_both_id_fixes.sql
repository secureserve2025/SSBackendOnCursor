-- Test Both ID Display Fixes
-- This script tests that both client and freelancer IDs display correctly

-- 1. Test the complete relationship chain for a sample project
SELECT 
    'Complete ID Display Test' as test_type,
    p.project_id,
    p.project_name,
    p.client_id as project_client_uuid,
    cp.client_id as client_display_id,  -- Should show like 'C926525225'
    p.freelancer_id as project_freelancer_uuid,
    fp.freelancer_id as freelancer_display_id,  -- Should show like 'F278645820'
    cp.full_name as client_name,
    fp.full_name as freelancer_name,
    p.project_status_workflow
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.project_status_workflow != 'Project Created'
ORDER BY p.created_at DESC
LIMIT 5;

-- 2. Test freelancer profile data that should be displayed
SELECT 
    'Freelancer Profile Display Test' as test_type,
    id as profile_uuid,
    freelancer_id as display_id,  -- This should show like 'F278645820'
    full_name,
    email,
    profile_completed,
    created_at
FROM freelancer_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Test client profile data that should be displayed
SELECT 
    'Client Profile Display Test' as test_type,
    id as profile_uuid,
    client_id as display_id,  -- This should show like 'C926525225'
    full_name,
    email,
    profile_completed,
    created_at
FROM client_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verify the UUID to human-readable ID mapping
SELECT 
    'UUID to Display ID Mapping' as test_type,
    'Client' as profile_type,
    id as uuid,
    client_id as display_id
FROM client_profiles
UNION ALL
SELECT 
    'UUID to Display ID Mapping' as test_type,
    'Freelancer' as profile_type,
    id as uuid,
    freelancer_id as display_id
FROM freelancer_profiles
ORDER BY profile_type, created_at DESC
LIMIT 10;

