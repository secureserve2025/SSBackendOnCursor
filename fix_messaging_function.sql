-- =============================================================================
-- FIX MESSAGING FUNCTION
-- This script creates a fixed version of the getProjectsForMessaging function
-- =============================================================================

-- First, let's create a simple test to see what's happening
-- Test the current getProjectsForMessaging function logic

-- Check if there are any projects for a specific freelancer
-- Replace 'YOUR_FREELANCER_USER_ID' with the actual user ID of the logged-in freelancer
-- You can find this in the browser console or by checking the freelancer_profiles table

-- Example query to test the logic:
/*
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    fp.full_name as freelancer_name,
    fp.user_id as freelancer_user_id
FROM projects p
JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE fp.user_id = 'YOUR_FREELANCER_USER_ID'
AND p.project_status_workflow != 'Project Created';
*/

-- Create a fixed version of the getProjectsForMessaging function
CREATE OR REPLACE FUNCTION get_projects_for_messaging_fixed(
    user_uuid UUID,
    user_type TEXT
)
RETURNS TABLE (
    id UUID,
    project_id TEXT,
    project_name TEXT,
    client_id TEXT,
    freelancer_id TEXT,
    project_status_workflow TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    client_profiles JSONB,
    freelancer_profiles JSONB
) AS $$
BEGIN
    IF user_type = 'freelancer' THEN
        -- For freelancers, get projects where they are the freelancer
        RETURN QUERY
        SELECT 
            p.id,
            p.project_id,
            p.project_name,
            p.client_id,
            p.freelancer_id,
            p.project_status_workflow,
            p.created_at,
            p.updated_at,
            -- Get client details
            COALESCE(
                (SELECT jsonb_build_object(
                    'full_name', cp.full_name,
                    'client_id', cp.client_id
                ) FROM client_profiles cp WHERE cp.id = p.client_id::UUID),
                '{}'::jsonb
            ) as client_profiles,
            -- Get freelancer details
            COALESCE(
                (SELECT jsonb_build_object(
                    'full_name', fp.full_name,
                    'freelancer_id', fp.freelancer_id
                ) FROM freelancer_profiles fp WHERE fp.id = p.freelancer_id::UUID),
                '{}'::jsonb
            ) as freelancer_profiles
        FROM projects p
        JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
        WHERE fp.user_id = user_uuid
        AND p.project_status_workflow != 'Project Created'
        ORDER BY p.updated_at DESC;
        
    ELSIF user_type = 'client' THEN
        -- For clients, get projects where they are the client
        RETURN QUERY
        SELECT 
            p.id,
            p.project_id,
            p.project_name,
            p.client_id,
            p.freelancer_id,
            p.project_status_workflow,
            p.created_at,
            p.updated_at,
            -- Get client details
            COALESCE(
                (SELECT jsonb_build_object(
                    'full_name', cp.full_name,
                    'client_id', cp.client_id
                ) FROM client_profiles cp WHERE cp.id = p.client_id::UUID),
                '{}'::jsonb
            ) as client_profiles,
            -- Get freelancer details
            COALESCE(
                (SELECT jsonb_build_object(
                    'full_name', fp.full_name,
                    'freelancer_id', fp.freelancer_id
                ) FROM freelancer_profiles fp WHERE fp.id = p.freelancer_id::UUID),
                '{}'::jsonb
            ) as freelancer_profiles
        FROM projects p
        JOIN client_profiles cp ON p.client_id = cp.id
        WHERE cp.user_id = user_uuid
        AND p.project_status_workflow != 'Project Created'
        ORDER BY p.updated_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function (replace with actual user ID)
-- SELECT * FROM get_projects_for_messaging_fixed('YOUR_USER_UUID', 'freelancer');

-- Create a simple test query to check if projects exist for messaging
-- This will help identify if the issue is with the function or the data

-- Check all projects with their status
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    p.client_id,
    fp.full_name as freelancer_name,
    cp.full_name as client_name
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
LEFT JOIN client_profiles cp ON p.client_id = cp.id
ORDER BY p.created_at DESC;

-- Check if there are any projects that should be available for messaging
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN project_status_workflow != 'Project Created' THEN 1 END) as available_for_messaging,
    COUNT(CASE WHEN project_status_workflow = 'Checklist Signed off' THEN 1 END) as checklist_signed_off
FROM projects;
