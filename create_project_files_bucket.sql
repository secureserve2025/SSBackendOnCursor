-- Create project-files storage bucket and policies
-- This script creates the missing storage bucket for project file uploads

-- 1. Create the project-files storage bucket
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

-- 2. Create storage policies for project files
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

-- 3. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Add comments for documentation
COMMENT ON TABLE storage.objects IS 'Storage objects for project files and other uploaded content';
