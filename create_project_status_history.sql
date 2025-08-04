-- Create a table to track project status changes with timestamps
-- This provides a complete audit trail of project progress

-- Create the project_status_history table
CREATE TABLE IF NOT EXISTS project_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id UUID,
    changed_by_user_type VARCHAR(20) CHECK (changed_by_user_type IN ('client', 'freelancer', 'system')),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we have at least one status
    CONSTRAINT check_status_not_null CHECK (new_status IS NOT NULL AND new_status != ''),
    
    -- Add index for efficient queries
    CONSTRAINT fk_project_status_history_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_created_at ON project_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_project_status_history_new_status ON project_status_history(new_status);

-- Add comments for documentation
COMMENT ON TABLE project_status_history IS 'Tracks all project status changes with timestamps for audit trail';
COMMENT ON COLUMN project_status_history.id IS 'Unique identifier for the status change record';
COMMENT ON COLUMN project_status_history.project_id IS 'Reference to the project that had a status change';
COMMENT ON COLUMN project_status_history.old_status IS 'Previous project status (NULL for initial status)';
COMMENT ON COLUMN project_status_history.new_status IS 'New project status';
COMMENT ON COLUMN project_status_history.changed_by_user_id IS 'User ID who made the status change';
COMMENT ON COLUMN project_status_history.changed_by_user_type IS 'Type of user who made the change (client, freelancer, system)';
COMMENT ON COLUMN project_status_history.change_reason IS 'Optional reason for the status change';
COMMENT ON COLUMN project_status_history.created_at IS 'Timestamp when the status change occurred';

-- Create a function to automatically log status changes
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if the status actually changed
    IF OLD.project_status_workflow IS DISTINCT FROM NEW.project_status_workflow THEN
        INSERT INTO project_status_history (
            project_id,
            old_status,
            new_status,
            changed_by_user_id,
            changed_by_user_type,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.project_status_workflow,
            NEW.project_status_workflow,
            NEW.updated_by_user_id, -- We'll add this column to projects table
            COALESCE(NEW.updated_by_user_type, 'system'),
            NEW.status_change_reason -- We'll add this column to projects table
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add columns to projects table to track who made changes
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS updated_by_user_id UUID,
ADD COLUMN IF NOT EXISTS updated_by_user_type VARCHAR(20) CHECK (updated_by_user_type IN ('client', 'freelancer', 'system')),
ADD COLUMN IF NOT EXISTS status_change_reason TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN projects.updated_by_user_id IS 'User ID who last updated the project';
COMMENT ON COLUMN projects.updated_by_user_type IS 'Type of user who last updated the project';
COMMENT ON COLUMN projects.status_change_reason IS 'Reason for the last status change';

-- Create trigger to automatically log status changes
DROP TRIGGER IF EXISTS trigger_log_project_status_change ON projects;
CREATE TRIGGER trigger_log_project_status_change
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION log_project_status_change();

-- Create a function to manually log status changes (for frontend use)
CREATE OR REPLACE FUNCTION manual_log_project_status_change(
    project_uuid UUID,
    new_status VARCHAR(50),
    user_id UUID DEFAULT NULL,
    user_type VARCHAR(20) DEFAULT 'system',
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(50);
BEGIN
    -- Get current status
    SELECT project_status_workflow INTO current_status 
    FROM projects 
    WHERE id = project_uuid;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Project with ID % does not exist', project_uuid;
    END IF;
    
    -- Log the status change
    INSERT INTO project_status_history (
        project_id,
        old_status,
        new_status,
        changed_by_user_id,
        changed_by_user_type,
        change_reason
    ) VALUES (
        project_uuid,
        current_status,
        new_status,
        user_id,
        user_type,
        reason
    );
    
    -- Update the project status
    UPDATE projects 
    SET 
        project_status_workflow = new_status,
        updated_by_user_id = user_id,
        updated_by_user_type = user_type,
        status_change_reason = reason,
        updated_at = NOW()
    WHERE id = project_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the manual logging function
COMMENT ON FUNCTION manual_log_project_status_change(UUID, VARCHAR, UUID, VARCHAR, TEXT) IS 'Manually log a project status change with user information and reason';

-- Create a function to get project status history
CREATE OR REPLACE FUNCTION get_project_status_history(project_uuid UUID)
RETURNS TABLE (
    id UUID,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by_user_type VARCHAR(20),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psh.id,
        psh.old_status,
        psh.new_status,
        psh.changed_by_user_type,
        psh.change_reason,
        psh.created_at
    FROM project_status_history psh
    WHERE psh.project_id = project_uuid
    ORDER BY psh.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the history function
COMMENT ON FUNCTION get_project_status_history(UUID) IS 'Get complete status change history for a project';

-- Create a function to get current project status with history count
CREATE OR REPLACE FUNCTION get_project_status_summary(project_uuid UUID)
RETURNS TABLE (
    project_id UUID,
    current_status VARCHAR(50),
    status_changes_count BIGINT,
    first_status_date TIMESTAMP WITH TIME ZONE,
    last_status_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_status_workflow,
        COUNT(psh.id)::BIGINT,
        MIN(psh.created_at),
        MAX(psh.created_at)
    FROM projects p
    LEFT JOIN project_status_history psh ON p.id = psh.project_id
    WHERE p.id = project_uuid
    GROUP BY p.id, p.project_status_workflow;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the summary function
COMMENT ON FUNCTION get_project_status_summary(UUID) IS 'Get project status summary with change count and date range'; 