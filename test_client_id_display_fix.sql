-- Test Client ID Display Fix
-- This script tests the relationship between projects and client_profiles

-- 1. Test the relationship between projects.client_id and client_profiles.id
SELECT 
    'Client ID Relationship Test' as test_type,
    p.id as project_id,
    p.project_id as project_display_id,
    p.client_id as project_client_id_uuid,
    cp.id as client_profile_id,
    cp.client_id as client_display_id_varchar,
    cp.full_name as client_name,
    CASE 
        WHEN p.client_id = cp.id THEN '✅ Correct: UUID to UUID (id)'
        ELSE '❌ Incorrect: No match'
    END as relationship_status
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.project_status_workflow != 'Project Created'
ORDER BY p.created_at DESC
LIMIT 10;

-- 2. Test freelancer ID relationship
SELECT 
    'Freelancer ID Relationship Test' as test_type,
    p.id as project_id,
    p.project_id as project_display_id,
    p.freelancer_id as project_freelancer_id_uuid,
    fp.id as freelancer_profile_id,
    fp.freelancer_id as freelancer_display_id_varchar,
    fp.full_name as freelancer_name,
    CASE 
        WHEN p.freelancer_id = fp.id THEN '✅ Correct: UUID to UUID (id)'
        ELSE '❌ Incorrect: No match'
    END as relationship_status
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.project_status_workflow != 'Project Created'
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Check if any projects have missing client profiles
SELECT 
    'Missing Client Profiles' as test_type,
    COUNT(*) as count,
    STRING_AGG(p.project_id, ', ') as project_ids
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.project_status_workflow != 'Project Created'
AND cp.id IS NULL;

-- 4. Check if any projects have missing freelancer profiles
SELECT 
    'Missing Freelancer Profiles' as test_type,
    COUNT(*) as count,
    STRING_AGG(p.project_id, ', ') as project_ids
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.project_status_workflow != 'Project Created'
AND fp.id IS NULL;

-- 5. Sample data showing what should be displayed
SELECT 
    'Sample Display Data' as test_type,
    p.project_id,
    p.project_name,
    cp.client_id as client_display_id,  -- This should show like 'C123456789'
    fp.freelancer_id as freelancer_display_id,  -- This should show like 'F123456789'
    p.project_status_workflow,
    cp.full_name as client_name,
    fp.full_name as freelancer_name
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.project_status_workflow != 'Project Created'
ORDER BY p.created_at DESC
LIMIT 5;

