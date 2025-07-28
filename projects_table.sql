-- Projects Table for SecureServe Platform
-- This table stores project information with relationships to client and freelancer profiles

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(5) UNIQUE NOT NULL, -- System generated: V + 4 digits (e.g., V1234)
    client_id VARCHAR(10) NOT NULL, -- References client_profiles.id
    freelancer_id VARCHAR(10) NOT NULL, -- References freelancer_profiles.id
    project_category VARCHAR(40) NOT NULL DEFAULT 'Video Production',
    project_name VARCHAR(20) NOT NULL,
    project_requirement TEXT NOT NULL, -- Multi-line text up to 200 chars
    desired_completion_date DATE NOT NULL,
    project_files JSONB, -- Store file uploads as JSON array
    deliverables JSONB NOT NULL, -- Store deliverables as JSON array
    project_status VARCHAR(20) DEFAULT 'Draft' CHECK (project_status IN ('Draft', 'Active', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clients can view and manage their own projects
CREATE POLICY "Clients can view own projects" ON projects
    FOR SELECT USING (client_id = current_setting('app.current_user_id', true)::VARCHAR);

CREATE POLICY "Clients can insert own projects" ON projects
    FOR INSERT WITH CHECK (client_id = current_setting('app.current_user_id', true)::VARCHAR);

CREATE POLICY "Clients can update own projects" ON projects
    FOR UPDATE USING (client_id = current_setting('app.current_user_id', true)::VARCHAR);

-- Freelancers can view projects assigned to them
CREATE POLICY "Freelancers can view assigned projects" ON projects
    FOR SELECT USING (freelancer_id = current_setting('app.current_user_id', true)::VARCHAR);

-- Function to generate project ID (V + 4 digits)
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS VARCHAR(5) AS $$
DECLARE
    new_id VARCHAR(5);
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate V + 4 digit number
        new_id := 'V' || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM projects WHERE project_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique project ID';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate freelancer ID exists
CREATE OR REPLACE FUNCTION validate_freelancer_id(freelancer_id_param VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM freelancer_profiles 
        WHERE id = freelancer_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate client ID exists
CREATE OR REPLACE FUNCTION validate_client_id(client_id_param VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_profiles 
        WHERE id = client_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Add constraints
ALTER TABLE projects 
ADD CONSTRAINT check_project_name_length 
CHECK (LENGTH(project_name) >= 3 AND LENGTH(project_name) <= 20);

ALTER TABLE projects 
ADD CONSTRAINT check_project_requirement_length 
CHECK (LENGTH(project_requirement) <= 200);

ALTER TABLE projects 
ADD CONSTRAINT check_completion_date_future 
CHECK (desired_completion_date > CURRENT_DATE);

ALTER TABLE projects 
ADD CONSTRAINT check_project_category_length 
CHECK (LENGTH(project_category) <= 40);

-- Add foreign key constraints (if tables exist)
-- Note: These will be added after ensuring the profile tables exist
-- ALTER TABLE projects ADD CONSTRAINT fk_projects_client_id 
--     FOREIGN KEY (client_id) REFERENCES client_profiles(id);
-- 
-- ALTER TABLE projects ADD CONSTRAINT fk_projects_freelancer_id 
--     FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id);

-- Insert sample data for testing (optional)
-- INSERT INTO projects (
--     project_id, client_id, freelancer_id, project_category, 
--     project_name, project_requirement, desired_completion_date, 
--     deliverables, project_status
-- ) VALUES (
--     'V0001', 'C123456789', 'F123456789', 'Video Production',
--     'Product Demo Video', 'Create a 2-minute product demonstration video with professional voiceover and background music.',
--     '2024-02-15', 
--     '["High-quality 1080p video in MP4 format", "Professional color grading", "Custom intro with brand elements"]',
--     'Draft'
-- ); 