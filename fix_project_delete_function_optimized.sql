-- Fix Project Delete Function (Optimized for "Project Created" Status)
-- This script creates an optimized delete_project_cascade RPC function for projects in "Project Created" status

-- First, let's check what tables actually exist
SELECT 
    'Existing Tables Check' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'projects', 
    'transactions', 
    'deliverables'
)
ORDER BY table_name;

-- Now create the optimized delete_project_cascade function
CREATE OR REPLACE FUNCTION delete_project_cascade(project_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER := 0;
    project_exists BOOLEAN;
    project_status VARCHAR(50);
    client_id UUID;
    current_user_id UUID;
    table_exists BOOLEAN;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if project exists and get client_id and status
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid), p.client_id, p.project_status_workflow
    INTO project_exists, client_id, project_status
    FROM projects p
    WHERE p.id = project_uuid;
    
    -- Check if project exists
    IF NOT project_exists THEN
        result := json_build_object(
            'success', false,
            'message', 'Project not found'
        );
        RETURN result;
    END IF;
    
    -- Check if current user is the project owner (client)
    IF current_user_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'User not authenticated'
        );
        RETURN result;
    END IF;
    
    -- Verify user owns this project by checking client_profiles
    IF NOT EXISTS(
        SELECT 1 FROM client_profiles 
        WHERE id = client_id AND user_id = current_user_id
    ) THEN
        result := json_build_object(
            'success', false,
            'message', 'Access denied: You can only delete your own projects'
        );
        RETURN result;
    END IF;
    
    -- Verify project is in "Project Created" status (only these can be deleted)
    IF project_status != 'Project Created' THEN
        result := json_build_object(
            'success', false,
            'message', 'Only projects in "Project Created" status can be deleted'
        );
        RETURN result;
    END IF;
    
    -- Start transaction to ensure all related records are deleted
    BEGIN
        -- Delete transactions (check if table exists)
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public')
        INTO table_exists;
        
        IF table_exists THEN
            DELETE FROM transactions WHERE project_id = project_uuid;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
        END IF;
        
        -- Delete deliverables (check if table exists)
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables' AND table_schema = 'public')
        INTO table_exists;
        
        IF table_exists THEN
            DELETE FROM deliverables WHERE project_id = project_uuid;
        END IF;
        
        -- Finally delete the project itself
        DELETE FROM projects WHERE id = project_uuid;
        
        -- Check if project was actually deleted
        IF NOT FOUND THEN
            result := json_build_object(
                'success', false,
                'message', 'Project not found'
            );
        ELSE
            result := json_build_object(
                'success', true,
                'message', 'Project and all related records deleted successfully',
                'transactions_deleted', deleted_count,
                'project_status', project_status
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        result := json_build_object(
            'success', false,
            'message', 'Error deleting project: ' || SQLERRM
        );
    END;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_project_cascade(UUID) TO authenticated;

-- Test the function (uncomment to test)
-- SELECT delete_project_cascade('d7a5a110-5975-4b96-997f-9691f62d7678'::UUID);











