-- Update File Upload Limits
-- This script documents the changes made to file upload functionality
-- Changed from: 2 files, 10MB each
-- Changed to: 1 file, 5MB maximum

-- Note: The project_files table structure remains the same
-- The file size limit is enforced at the application level
-- No database schema changes are required

-- Current file upload configuration:
-- - Maximum files per project: 1
-- - Maximum file size: 5MB (5,242,880 bytes)
-- - Allowed file types: PDF, DOC, DOCX
-- - Allowed MIME types: 
--   * application/pdf
--   * application/msword
--   * application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- The project_files table structure:
/*
CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL, -- Size in bytes (now limited to 5MB)
    file_type VARCHAR(50) NOT NULL, -- MIME type
    storage_bucket VARCHAR(100) DEFAULT 'project-files',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Application-level validation ensures:
-- 1. Only one file can be uploaded per project
-- 2. File size cannot exceed 5MB
-- 3. Only PDF, DOC, DOCX files are allowed
-- 4. Files are stored in Supabase Storage bucket 'project-files'

-- No database changes required - all limits are enforced in the frontend and API layer 