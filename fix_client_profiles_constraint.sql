-- Fix for client_profiles foreign key constraint issue
-- This script adds the necessary unique constraint and updates the projects table

-- 1. First, let's check the current structure of client_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'client_profiles'
ORDER BY ordinal_position;

-- 2. Add unique constraint to client_profiles.user_id if it doesn't exist
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'client_profiles_user_id_key' 
        AND table_name = 'client_profiles'
    ) THEN
        -- Add unique constraint
        ALTER TABLE client_profiles ADD CONSTRAINT client_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Drop the existing projects table if it exists (since it has the wrong foreign key)
DROP TABLE IF EXISTS project_files CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 4. Recreate the projects table with correct foreign key references
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id VARCHAR(10) UNIQUE NOT NULL, -- Auto-generated V-prefixed ID (e.g., V1001)
    client_id UUID NOT NULL REFERENCES client_profiles(user_id) ON DELETE CASCADE,
    freelancer_id VARCHAR(20) NOT NULL REFERENCES freelancer_profiles(freelancer_id) ON DELETE CASCADE,
    project_category VARCHAR(50) DEFAULT 'Video Production' NOT NULL,
    project_name VARCHAR(20) NOT NULL CHECK (LENGTH(project_name) >= 3 AND LENGTH(project_name) <= 20),
    project_requirement TEXT NOT NULL CHECK (LENGTH(project_requirement) <= 200),
    desired_completion_date DATE NOT NULL CHECK (desired_completion_date > CURRENT_DATE),
    project_status VARCHAR(20) DEFAULT 'Draft' CHECK (project_status IN ('Draft', 'Active', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Project Files Table
CREATE TABLE project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL, -- Size in bytes
    file_type VARCHAR(50) NOT NULL, -- MIME type
    storage_bucket VARCHAR(100) DEFAULT 'project-files',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Deliverables Table
CREATE TABLE deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    deliverable_text VARCHAR(200) NOT NULL CHECK (LENGTH(deliverable_text) <= 200),
    deliverable_order INTEGER NOT NULL, -- To maintain order of deliverables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for better performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(project_status);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX idx_deliverables_order ON deliverables(project_id, deliverable_order);

-- 8. Create function to auto-generate project IDs
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_id INTEGER;
    project_id VARCHAR(10);
BEGIN
    -- Get the next available ID
    SELECT COALESCE(MAX(CAST(SUBSTRING(project_id FROM 2) AS INTEGER)), 1000) + 1
    INTO next_id
    FROM projects
    WHERE project_id LIKE 'V%';
    
    -- Format as V + 4-digit number
    project_id := 'V' || LPAD(next_id::TEXT, 4, '0');
    
    RETURN project_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-assign project_id when project is created
CREATE OR REPLACE FUNCTION auto_assign_project_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NULL OR NEW.project_id = '' THEN
        NEW.project_id := generate_project_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_project_id
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_project_id();

-- 10. Create function to validate freelancer ID exists
CREATE OR REPLACE FUNCTION validate_freelancer_id(freelancer_id_param VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    freelancer_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM freelancer_profiles 
        WHERE freelancer_id = freelancer_id_param
    ) INTO freelancer_exists;
    
    RETURN freelancer_exists;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to get project with all related data
CREATE OR REPLACE FUNCTION get_project_with_details(project_uuid UUID)
RETURNS TABLE(
    project_data JSON,
    files_data JSON,
    deliverables_data JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT row_to_json(p.*) FROM projects p WHERE p.id = project_uuid) as project_data,
        (SELECT json_agg(row_to_json(pf.*)) FROM project_files pf WHERE pf.project_id = project_uuid) as files_data,
        (SELECT json_agg(row_to_json(d.*) ORDER BY d.deliverable_order) FROM deliverables d WHERE d.project_id = project_uuid) as deliverables_data;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to clean up project files on project deletion
CREATE OR REPLACE FUNCTION cleanup_project_files()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete files from Supabase Storage (this would be handled in application code)
    -- For now, we just delete the file records
    DELETE FROM project_files WHERE project_id = OLD.id;
    DELETE FROM deliverables WHERE project_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_project_files
    BEFORE DELETE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_project_files();

-- 13. Create RLS (Row Level Security) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (
        client_id IN (
            SELECT user_id FROM client_profiles WHERE user_id = auth.uid()
        ) OR
        freelancer_id IN (
            SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can create their own projects" ON projects
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT user_id FROM client_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (
        client_id IN (
            SELECT user_id FROM client_profiles WHERE user_id = auth.uid()
        ) OR
        freelancer_id IN (
            SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

-- Project files RLS policies
CREATE POLICY "Users can view files for their projects" ON project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can upload files for their projects" ON project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        )
    );

-- Deliverables RLS policies
CREATE POLICY "Users can view deliverables for their projects" ON deliverables
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage deliverables for their projects" ON deliverables
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- 14. Create storage policies
CREATE POLICY "Users can upload project files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their project files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 15. Add comments for documentation
COMMENT ON TABLE projects IS 'Stores project information with auto-generated V-prefixed IDs';
COMMENT ON TABLE project_files IS 'Stores metadata for files uploaded to Supabase Storage';
COMMENT ON TABLE deliverables IS 'Stores project deliverables as separate entries for flexibility';
COMMENT ON FUNCTION generate_project_id() IS 'Auto-generates V-prefixed project IDs (e.g., V1001)';
COMMENT ON FUNCTION validate_freelancer_id(VARCHAR) IS 'Validates that a freelancer ID exists in freelancer_profiles';

-- 16. Create view for project summary
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_category,
    p.project_status,
    p.desired_completion_date,
    cp.full_name as client_name,
    fp.full_name as freelancer_name,
    COUNT(pf.id) as file_count,
    COUNT(d.id) as deliverable_count,
    p.created_at
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.user_id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
LEFT JOIN project_files pf ON p.id = pf.project_id
LEFT JOIN deliverables d ON p.id = d.project_id
GROUP BY p.id, cp.full_name, fp.full_name; 