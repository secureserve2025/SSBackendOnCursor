-- Update Projects table and add new tables for Work Product and Verification Report
-- This script adds the Project Status field and creates new tables for project workflow

-- 1. First, let's add the new Project Status field to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_status_workflow VARCHAR(25) DEFAULT 'Project Created' 
CHECK (project_status_workflow IN (
    'Project Created',
    'Assigned to Freelancer', 
    'Checklist Signed off',
    'Fund Secured',
    'Production in Progress',
    'AI Verified',
    'Under Manual Revision',
    'Successfully Closed',
    'Product Rejected'
));

-- 2. Create Work Product table to store final video file information
CREATE TABLE IF NOT EXISTS work_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL, -- Size in bytes
    file_type VARCHAR(50) NOT NULL, -- MIME type (e.g., video/mp4)
    storage_bucket VARCHAR(100) DEFAULT 'work-products',
    video_duration INTEGER, -- Duration in seconds
    video_resolution VARCHAR(20), -- e.g., "1920x1080"
    video_format VARCHAR(20), -- e.g., "MP4", "AVI"
    upload_status VARCHAR(20) DEFAULT 'Uploaded' CHECK (upload_status IN ('Uploading', 'Uploaded', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Verification Report table to store verification file information
CREATE TABLE IF NOT EXISTS verification_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_title VARCHAR(255) NOT NULL,
    report_content TEXT NOT NULL, -- The actual verification report text
    report_type VARCHAR(50) DEFAULT 'AI Verification' CHECK (report_type IN ('AI Verification', 'Manual Review', 'Quality Check')),
    verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'In Progress', 'Completed', 'Failed')),
    verified_by VARCHAR(100), -- Name of the person who verified
    verification_score DECIMAL(3,2), -- Score from 0.00 to 1.00
    verification_notes TEXT, -- Additional notes about the verification
    file_path VARCHAR(500), -- Optional: path to uploaded verification file
    file_size BIGINT, -- Size in bytes if file is uploaded
    file_type VARCHAR(50), -- MIME type if file is uploaded
    storage_bucket VARCHAR(100) DEFAULT 'verification-reports',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status_workflow ON projects(project_status_workflow);
CREATE INDEX IF NOT EXISTS idx_work_products_project_id ON work_products(project_id);
CREATE INDEX IF NOT EXISTS idx_work_products_upload_status ON work_products(upload_status);
CREATE INDEX IF NOT EXISTS idx_verification_reports_project_id ON verification_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_verification_reports_status ON verification_reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_reports_type ON verification_reports(report_type);

-- 5. Create function to update project status workflow
CREATE OR REPLACE FUNCTION update_project_status_workflow(
    project_uuid UUID,
    new_status VARCHAR(25)
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_status BOOLEAN;
BEGIN
    -- Validate the new status
    SELECT new_status IN (
        'Project Created',
        'Assigned to Freelancer', 
        'Checklist Signed off',
        'Fund Secured',
        'Production in Progress',
        'AI Verified',
        'Under Manual Revision',
        'Successfully Closed',
        'Product Rejected'
    ) INTO valid_status;
    
    IF NOT valid_status THEN
        RAISE EXCEPTION 'Invalid project status: %', new_status;
    END IF;
    
    -- Update the project status
    UPDATE projects 
    SET 
        project_status_workflow = new_status,
        updated_at = NOW()
    WHERE id = project_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get project with all related data including new tables
CREATE OR REPLACE FUNCTION get_project_with_all_details(project_uuid UUID)
RETURNS TABLE(
    project_data JSON,
    files_data JSON,
    deliverables_data JSON,
    work_products_data JSON,
    verification_reports_data JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT row_to_json(p.*) FROM projects p WHERE p.id = project_uuid) as project_data,
        (SELECT json_agg(row_to_json(pf.*)) FROM project_files pf WHERE pf.project_id = project_uuid) as files_data,
        (SELECT json_agg(row_to_json(d.*) ORDER BY d.deliverable_order) FROM deliverables d WHERE d.project_id = project_uuid) as deliverables_data,
        (SELECT json_agg(row_to_json(wp.*)) FROM work_products wp WHERE wp.project_id = project_uuid) as work_products_data,
        (SELECT json_agg(row_to_json(vr.*)) FROM verification_reports vr WHERE vr.project_id = project_uuid) as verification_reports_data;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to clean up work products and verification reports on project deletion
CREATE OR REPLACE FUNCTION cleanup_project_workflow_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete work products and verification reports when project is deleted
    DELETE FROM work_products WHERE project_id = OLD.id;
    DELETE FROM verification_reports WHERE project_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Update the existing cleanup trigger to include new tables
DROP TRIGGER IF EXISTS trigger_cleanup_project_files ON projects;
CREATE TRIGGER trigger_cleanup_project_workflow_data
    BEFORE DELETE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_project_workflow_data();

-- 8. Create RLS (Row Level Security) policies for new tables
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

-- Work Products RLS policies
CREATE POLICY "Users can view work products for their projects" ON work_products
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can upload work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update work products for their projects" ON work_products
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- Verification Reports RLS policies
CREATE POLICY "Users can view verification reports for their projects" ON verification_reports
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create verification reports for their projects" ON verification_reports
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update verification reports for their projects" ON verification_reports
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- 9. Create storage policies for new buckets
CREATE POLICY "Users can upload work products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their work products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload verification reports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'verification-reports' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their verification reports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'verification-reports' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 10. Add comments for documentation
COMMENT ON COLUMN projects.project_status_workflow IS 'Workflow status of the project with predefined values';
COMMENT ON TABLE work_products IS 'Stores final video files and related metadata for completed projects';
COMMENT ON TABLE verification_reports IS 'Stores verification reports and quality check results for projects';
COMMENT ON FUNCTION update_project_status_workflow(UUID, VARCHAR) IS 'Updates the project workflow status with validation';

-- 11. Create updated view for project summary with new fields
CREATE OR REPLACE VIEW project_summary_extended AS
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_category,
    p.project_status,
    p.project_status_workflow,
    p.desired_completion_date,
    cp.full_name as client_name,
    fp.full_name as freelancer_name,
    COUNT(pf.id) as file_count,
    COUNT(d.id) as deliverable_count,
    COUNT(wp.id) as work_product_count,
    COUNT(vr.id) as verification_report_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.user_id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
LEFT JOIN project_files pf ON p.id = pf.project_id
LEFT JOIN deliverables d ON p.id = d.project_id
LEFT JOIN work_products wp ON p.id = wp.project_id
LEFT JOIN verification_reports vr ON p.id = vr.project_id
GROUP BY p.id, cp.full_name, fp.full_name;

-- 12. Test the setup
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('work_products', 'verification_reports');

-- Test the project status workflow function
SELECT update_project_status_workflow(
    (SELECT id FROM projects LIMIT 1), 
    'Project Created'
) as test_status_update; 