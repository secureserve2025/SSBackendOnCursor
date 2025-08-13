-- Fix Project Delete Function
-- This script creates a proper delete_project_cascade RPC function

-- First, let's create the delete_project_cascade function
CREATE OR REPLACE FUNCTION delete_project_cascade(project_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    deleted_count INTEGER := 0;
    project_exists BOOLEAN;
    client_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if project exists and get client_id
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid), p.client_id
    INTO project_exists, client_id
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
    
    -- Start transaction to ensure all related records are deleted
    BEGIN
        -- Delete project files first
        DELETE FROM project_files WHERE project_id = project_uuid;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Delete deliverables
        DELETE FROM deliverables WHERE project_id = project_uuid;
        
        -- Delete work products
        DELETE FROM work_products WHERE project_id = project_uuid;
        
        -- Delete verification reports
        DELETE FROM verification_reports WHERE project_id = project_uuid;
        
        -- Delete messages
        DELETE FROM messages WHERE project_id = project_uuid;
        
        -- Delete transactions
        DELETE FROM transactions WHERE project_id = project_uuid;
        
        -- Delete project status history
        DELETE FROM project_status_history WHERE project_id = project_uuid;
        
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
                'files_deleted', deleted_count
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

-- Test the function (this will show if it works)
-- Note: Replace 'your-project-uuid' with an actual project UUID for testing
-- SELECT delete_project_cascade('2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'::UUID);









