-- Comprehensive Dashboard Display Fix
-- This script fixes all display issues in both Client and Freelancer dashboards

-- 1. First, let's check what tables exist and their current structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'projects', 'deliverables', 'work_products', 'verification_reports', 
    'project_files', 'project_status_history', 'client_profiles', 'freelancer_profiles'
)
ORDER BY table_name, ordinal_position;

-- 2. Create missing tables if they don't exist

-- Deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    deliverable_text TEXT NOT NULL,
    deliverable_order INTEGER DEFAULT 0,
    ai_chat_messages JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Products table
CREATE TABLE IF NOT EXISTS work_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    video_duration INTEGER,
    video_resolution VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Reports table
CREATE TABLE IF NOT EXISTS verification_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    ai_verification_result JSONB,
    manual_verification_notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Status History table
CREATE TABLE IF NOT EXISTS project_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    old_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add missing columns to existing tables if they don't exist

-- Add project_status_workflow to projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_status_workflow VARCHAR(100) DEFAULT 'Project Created';
    END IF;
END $$;

-- Add project_id to projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_id VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- Add sent_to_freelancer to projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'sent_to_freelancer'
    ) THEN
        ALTER TABLE projects ADD COLUMN sent_to_freelancer BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_work_products_project_id ON work_products(project_id);
CREATE INDEX IF NOT EXISTS idx_verification_reports_project_id ON verification_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status_workflow ON projects(project_status_workflow);

-- 5. Enable RLS on new tables
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for new tables

-- Deliverables RLS policies
CREATE POLICY IF NOT EXISTS "Users can view deliverables for their projects" ON deliverables
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Clients can create deliverables for their projects" ON deliverables
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update deliverables for their projects" ON deliverables
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

-- Work Products RLS policies
CREATE POLICY IF NOT EXISTS "Users can view work products for their projects" ON work_products
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Freelancers can create work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

-- Verification Reports RLS policies
CREATE POLICY IF NOT EXISTS "Users can view verification reports for their projects" ON verification_reports
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

-- Project Files RLS policies
CREATE POLICY IF NOT EXISTS "Users can view project files for their projects" ON project_files
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

-- 7. Create functions to generate human-readable IDs

-- Function to generate project IDs
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_id INTEGER;
    new_project_id VARCHAR(20);
BEGIN
    -- Get the next available ID
    SELECT COALESCE(MAX(CAST(SUBSTRING(project_id FROM 2) AS INTEGER)), 1000) + 1
    INTO next_id
    FROM projects
    WHERE project_id LIKE 'V%';
    
    -- Format as V + 4-digit number
    new_project_id := 'V' || LPAD(next_id::TEXT, 4, '0');
    
    RETURN new_project_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-generate project IDs
CREATE OR REPLACE FUNCTION auto_assign_project_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NULL THEN
        NEW.project_id := generate_project_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_project_id ON projects;
CREATE TRIGGER trigger_auto_assign_project_id
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_project_id();

-- 9. Create updated view functions for better data display

-- Function to get client projects with human-readable IDs
CREATE OR REPLACE FUNCTION get_client_projects_display(client_uuid UUID)
RETURNS TABLE (
    id UUID,
    project_id VARCHAR(20),
    project_name VARCHAR(255),
    freelancer_id VARCHAR(20),
    freelancer_name VARCHAR(255),
    project_status_workflow VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_id,
        p.project_name,
        fp.freelancer_id,
        fp.full_name as freelancer_name,
        p.project_status_workflow,
        p.created_at
    FROM projects p
    LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
    WHERE p.client_id = client_uuid
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get freelancer projects with human-readable IDs
CREATE OR REPLACE FUNCTION get_freelancer_projects_display(freelancer_uuid UUID)
RETURNS TABLE (
    id UUID,
    project_id VARCHAR(20),
    project_name VARCHAR(255),
    client_id VARCHAR(20),
    client_name VARCHAR(255),
    project_status_workflow VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_id,
        p.project_name,
        cp.client_id,
        cp.full_name as client_name,
        p.project_status_workflow,
        p.created_at
    FROM projects p
    LEFT JOIN client_profiles cp ON p.client_id = cp.id
    WHERE p.freelancer_id = freelancer_uuid
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update existing projects to have project_id if missing
UPDATE projects 
SET project_id = generate_project_id() 
WHERE project_id IS NULL;

-- 11. Verify the fix by checking table structure
SELECT 
    'Table Structure Check' as check_type,
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'projects', 'deliverables', 'work_products', 'verification_reports', 
    'project_files', 'project_status_history', 'client_profiles', 'freelancer_profiles'
)
GROUP BY table_name
ORDER BY table_name;

-- 12. Check if there are any projects without project_id
SELECT 
    'Projects without project_id' as check_type,
    COUNT(*) as count
FROM projects 
WHERE project_id IS NULL;











