-- Fix Project File Upload Issue
-- This script resolves the issue where project files are not being saved to the database

-- 1. Create the project-files storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files',
    false,
    5242880, -- 5MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Ensure project_files table exists with correct structure
CREATE TABLE IF NOT EXISTS project_files (
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

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at);

-- 4. Enable RLS on project_files table
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for project_files
-- Users can view files for their projects
CREATE POLICY "Users can view files for their projects" ON project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()::uuid
                OR freelancer_id IN (
                    SELECT freelancer_id FROM freelancer_profiles 
                    WHERE user_id = auth.uid()::uuid
                )
        )
    );

-- Users can upload files for their projects
CREATE POLICY "Users can upload files for their projects" ON project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()::uuid
        )
    );

-- Users can update files for their projects
CREATE POLICY "Users can update files for their projects" ON project_files
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()::uuid
        )
    );

-- Users can delete files for their projects
CREATE POLICY "Users can delete files for their projects" ON project_files
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id = auth.uid()::uuid
        )
    );

-- 6. Create storage policies for project files
-- Users can upload files to their own project folders
CREATE POLICY "Users can upload project files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can view files in their own project folders
CREATE POLICY "Users can view their project files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update files in their own project folders
CREATE POLICY "Users can update their project files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete files in their own project folders
CREATE POLICY "Users can delete their project files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 7. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 8. Create function to get project files with details
CREATE OR REPLACE FUNCTION get_project_files_with_details(project_uuid UUID)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    storage_bucket VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    public_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.project_id,
        pf.file_name,
        pf.file_path,
        pf.file_size,
        pf.file_type,
        pf.storage_bucket,
        pf.uploaded_at,
        pf.created_at,
        storage.get_public_url(pf.storage_bucket, pf.file_path) as public_url
    FROM project_files pf
    WHERE pf.project_id = project_uuid
    ORDER BY pf.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add comments for documentation
COMMENT ON TABLE project_files IS 'Stores metadata for files uploaded to Supabase Storage for projects';
COMMENT ON FUNCTION get_project_files_with_details(UUID) IS 'Returns project files with public URLs for display';

-- 10. Verify the fix
DO $$
BEGIN
    -- Check if storage bucket exists
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-files') THEN
        RAISE EXCEPTION 'Storage bucket "project-files" was not created successfully';
    END IF;
    
    -- Check if project_files table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') THEN
        RAISE EXCEPTION 'project_files table was not created successfully';
    END IF;
    
    RAISE NOTICE 'Project file upload fix applied successfully!';
END $$;
