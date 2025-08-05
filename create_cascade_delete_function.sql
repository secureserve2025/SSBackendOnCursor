-- Create cascade delete function for projects
-- This function will delete a project and all its related records

CREATE OR REPLACE FUNCTION delete_project_cascade(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    deleted_count INTEGER := 0;
BEGIN
    -- Start transaction
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
$$ LANGUAGE plpgsql;

-- Add comment to document the function
COMMENT ON FUNCTION delete_project_cascade(UUID) IS 'Deletes a project and all its related records (files, deliverables, transactions, etc.) in a single transaction';

-- Test the function
DO $$
DECLARE
    test_project_id UUID;
    test_result JSON;
BEGIN
    -- Get a test project ID
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Test the function (this will actually delete the project)
        -- SELECT delete_project_cascade(test_project_id) INTO test_result;
        -- RAISE NOTICE 'Test result: %', test_result;
        RAISE NOTICE 'Cascade delete function created successfully. Test project ID: %', test_project_id;
    ELSE
        RAISE NOTICE 'No projects found for testing';
    END IF;
END $$; 