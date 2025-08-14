-- Diagnose Transaction RLS Policy Issue
-- This script helps identify why the transaction RLS policy is failing

-- 1. Check current user
SELECT 
    'Current User' as test_type,
    auth.uid() as current_user_id;

-- 2. Check the specific project details
SELECT 
    'Project Details' as test_type,
    p.id as project_id,
    p.project_name,
    p.client_id as project_client_id,
    p.freelancer_id as project_freelancer_id
FROM projects p
WHERE p.id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'::UUID;

-- 3. Check the client profile that owns this project
SELECT 
    'Client Profile for Project' as test_type,
    cp.id as client_profile_id,
    cp.user_id as client_user_id,
    cp.client_id as display_client_id,
    cp.email
FROM client_profiles cp
WHERE cp.id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'::UUID;

-- 4. Check if the current user owns the client profile
SELECT 
    'User Ownership of Client Profile' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM client_profiles 
            WHERE id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'::UUID
            AND user_id = auth.uid()
        ) THEN '✅ User owns this client profile'
        ELSE '❌ User does not own this client profile'
    END as ownership_check;

-- 5. Test the exact JOIN logic from the RLS policy
SELECT 
    'RLS Policy JOIN Test' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM client_profiles cp 
            JOIN projects p ON p.client_id = cp.id 
            WHERE p.id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'::UUID
            AND cp.user_id = auth.uid()
        ) THEN '✅ JOIN logic works correctly'
        ELSE '❌ JOIN logic is failing'
    END as join_test;

-- 6. Show the exact data being joined
SELECT 
    'Detailed JOIN Data' as test_type,
    cp.id as client_profile_id,
    cp.user_id as client_user_id,
    p.id as project_id,
    p.client_id as project_client_id,
    CASE 
        WHEN cp.user_id = auth.uid() THEN '✅ Current user'
        ELSE '❌ Different user'
    END as user_match
FROM client_profiles cp 
JOIN projects p ON p.client_id = cp.id 
WHERE p.id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'::UUID;











