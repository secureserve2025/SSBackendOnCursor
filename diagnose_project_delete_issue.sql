-- Diagnose Project Delete Issue
-- This script checks if the delete_project_cascade RPC function exists and tests deletion permissions

-- Check if the RPC function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'delete_project_cascade';

-- Check current RLS policies on projects table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- Check if we can see the specific project
SELECT 
    id,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
WHERE id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5';

-- Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- Test if we can delete the project directly (this will show RLS policy errors)
-- Note: This will likely fail due to RLS, but will show us the exact error
DELETE FROM projects 
WHERE id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'
RETURNING id, project_id, project_name;











