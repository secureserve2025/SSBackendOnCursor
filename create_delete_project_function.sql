-- Create function to delete project and all related records
-- This function safely deletes a project and all its associated data

CREATE OR REPLACE FUNCTION delete_project_cascade(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    project_exists BOOLEAN;
    deleted_count INTEGER := 0;
BEGIN
    -- Check if project exists
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_uuid) INTO project_exists;
    
    IF NOT project_exists THEN
        RAISE EXCEPTION 'Project with ID % does not exist', project_uuid;
    END IF;

    -- Delete in order to respect foreign key constraints
    -- 1. Delete verification reports
    DELETE FROM verification_reports WHERE project_id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % verification reports for project %', deleted_count, project_uuid;
    
    -- 2. Delete work products
    DELETE FROM work_products WHERE project_id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % work products for project %', deleted_count, project_uuid;
    
    -- 3. Delete deliverables
    DELETE FROM deliverables WHERE project_id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % deliverables for project %', deleted_count, project_uuid;
    
    -- 4. Delete project files (database records)
    DELETE FROM project_files WHERE project_id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % project files for project %', deleted_count, project_uuid;
    
    -- 5. Delete messages
    DELETE FROM messages WHERE project_id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % messages for project %', deleted_count, project_uuid;
    
    -- 6. Delete transactions
    DELETE FROM transactions WHERE project_id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % transactions for project %', deleted_count, project_uuid;
    
    -- 7. Finally delete the project
    DELETE FROM projects WHERE id = project_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted project % (affected % rows)', project_uuid, deleted_count;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the function
COMMENT ON FUNCTION delete_project_cascade(UUID) IS 'Safely deletes a project and all its related records in the correct order to respect foreign key constraints. Handles: verification_reports, work_products, deliverables, project_files, messages, transactions, and finally the project itself.';

-- Test the function (optional - uncomment to test)
-- SELECT delete_project_cascade('00000000-0000-0000-0000-000000000000'); 