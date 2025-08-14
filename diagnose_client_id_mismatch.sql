-- Diagnose Client ID Mismatch Issue
-- This script helps identify why the RLS policy is failing

-- 1. Check current user
SELECT 
    'Current User' as test_type,
    auth.uid() as current_user_id;

-- 2. Check all client profiles for the current user
SELECT 
    'Client Profiles for Current User' as test_type,
    id,
    user_id,
    client_id,
    email,
    full_name
FROM client_profiles 
WHERE user_id = auth.uid();

-- 3. Check if the specific client_id exists
SELECT 
    'Specific Client ID Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM client_profiles 
            WHERE id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'::UUID
        ) THEN '✅ Client ID exists in database'
        ELSE '❌ Client ID does not exist in database'
    END as client_id_exists;

-- 4. Check if the specific client_id belongs to the current user
SELECT 
    'Client ID Ownership Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM client_profiles 
            WHERE id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'::UUID
            AND user_id = auth.uid()
        ) THEN '✅ Client ID belongs to current user'
        ELSE '❌ Client ID does not belong to current user'
    END as client_id_ownership;

-- 5. Show the actual client profile that belongs to current user
SELECT 
    'Correct Client Profile' as test_type,
    id as correct_client_id,
    user_id,
    client_id as display_client_id,
    email
FROM client_profiles 
WHERE user_id = auth.uid()
LIMIT 1;











