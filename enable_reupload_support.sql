-- Enable Re-upload Support for Work Products
-- This script adds database support for video re-uploads without breaking existing functionality

-- 1. Add new status values to work_products table
ALTER TABLE work_products 
DROP CONSTRAINT IF EXISTS work_products_upload_status_check;

ALTER TABLE work_products 
ADD CONSTRAINT work_products_upload_status_check 
CHECK (upload_status IN ('Uploading', 'Uploaded', 'Failed', 'Archived', 'Replaced'));

-- 2. Add version tracking column
ALTER TABLE work_products 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- 3. Add re-upload metadata columns
ALTER TABLE work_products 
ADD COLUMN IF NOT EXISTS replaced_by UUID REFERENCES work_products(id),
ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reupload_reason VARCHAR(255);

-- 4. Create index for version tracking
CREATE INDEX IF NOT EXISTS idx_work_products_version ON work_products(project_id, version_number);
CREATE INDEX IF NOT EXISTS idx_work_products_replaced_by ON work_products(replaced_by);

-- 5. Create function to get latest work product for a project
CREATE OR REPLACE FUNCTION get_latest_work_product(project_uuid UUID)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    storage_bucket VARCHAR(100),
    video_duration INTEGER,
    video_resolution VARCHAR(20),
    video_format VARCHAR(20),
    upload_status VARCHAR(20),
    version_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wp.id,
        wp.project_id,
        wp.file_name,
        wp.file_path,
        wp.file_size,
        wp.file_type,
        wp.storage_bucket,
        wp.video_duration,
        wp.video_resolution,
        wp.video_format,
        wp.upload_status,
        wp.version_number,
        wp.created_at,
        wp.updated_at
    FROM work_products wp
    WHERE wp.project_id = project_uuid
    AND wp.upload_status = 'Uploaded'
    ORDER BY wp.version_number DESC, wp.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to archive work product
CREATE OR REPLACE FUNCTION archive_work_product(work_product_uuid UUID, reason VARCHAR(255) DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE work_products 
    SET 
        upload_status = 'Archived',
        updated_at = NOW(),
        reupload_reason = reason
    WHERE id = work_product_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to create new version of work product
CREATE OR REPLACE FUNCTION create_work_product_version(
    project_uuid UUID,
    file_name_val VARCHAR(255),
    file_path_val VARCHAR(500),
    file_size_val BIGINT,
    file_type_val VARCHAR(50),
    video_duration_val INTEGER DEFAULT 0,
    video_resolution_val VARCHAR(20) DEFAULT 'Unknown',
    video_format_val VARCHAR(20) DEFAULT 'MP4',
    reupload_reason_val VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_version_number INTEGER;
    new_work_product_id UUID;
    old_work_product_id UUID;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO new_version_number
    FROM work_products
    WHERE project_id = project_uuid;
    
    -- Archive the current work product if it exists
    SELECT id INTO old_work_product_id
    FROM work_products
    WHERE project_id = project_uuid
    AND upload_status = 'Uploaded'
    ORDER BY version_number DESC, created_at DESC
    LIMIT 1;
    
    IF old_work_product_id IS NOT NULL THEN
        UPDATE work_products 
        SET 
            upload_status = 'Archived',
            updated_at = NOW(),
            reupload_reason = reupload_reason_val
        WHERE id = old_work_product_id;
    END IF;
    
    -- Create new work product
    INSERT INTO work_products (
        project_id,
        file_name,
        file_path,
        file_size,
        file_type,
        video_duration,
        video_resolution,
        video_format,
        upload_status,
        version_number,
        replaced_by,
        replaced_at,
        reupload_reason
    ) VALUES (
        project_uuid,
        file_name_val,
        file_path_val,
        file_size_val,
        file_type_val,
        video_duration_val,
        video_resolution_val,
        video_format_val,
        'Uploaded',
        new_version_number,
        old_work_product_id,
        NOW(),
        reupload_reason_val
    ) RETURNING id INTO new_work_product_id;
    
    -- Update the replaced_by reference for the old work product
    IF old_work_product_id IS NOT NULL THEN
        UPDATE work_products 
        SET replaced_by = new_work_product_id
        WHERE id = old_work_product_id;
    END IF;
    
    RETURN new_work_product_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for work product history
CREATE OR REPLACE VIEW work_product_history AS
SELECT 
    wp.id,
    wp.project_id,
    wp.file_name,
    wp.file_path,
    wp.file_size,
    wp.file_type,
    wp.video_duration,
    wp.video_resolution,
    wp.video_format,
    wp.upload_status,
    wp.version_number,
    wp.reupload_reason,
    wp.created_at,
    wp.updated_at,
    p.project_name,
    p.project_status_workflow,
    ROW_NUMBER() OVER (PARTITION BY wp.project_id ORDER BY wp.version_number DESC, wp.created_at DESC) as version_rank
FROM work_products wp
JOIN projects p ON wp.project_id = p.id
ORDER BY wp.project_id, wp.version_number DESC, wp.created_at DESC;

-- 9. Create function to get work product statistics
CREATE OR REPLACE FUNCTION get_work_product_stats(project_uuid UUID)
RETURNS TABLE(
    total_versions INTEGER,
    current_version INTEGER,
    first_upload_date TIMESTAMP WITH TIME ZONE,
    last_upload_date TIMESTAMP WITH TIME ZONE,
    total_file_size BIGINT,
    average_file_size BIGINT,
    has_reupload_history BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_versions,
        MAX(version_number)::INTEGER as current_version,
        MIN(created_at) as first_upload_date,
        MAX(created_at) as last_upload_date,
        SUM(file_size) as total_file_size,
        AVG(file_size)::BIGINT as average_file_size,
        COUNT(*) > 1 as has_reupload_history
    FROM work_products
    WHERE project_id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- 10. Update RLS policies to support re-upload functionality
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;

-- Create enhanced policies that support re-uploads
CREATE POLICY "Users can view work products for their projects" ON work_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = work_products.project_id
            AND (
                p.client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR p.freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can upload work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
            WHERE fp.user_id = auth.uid()
            AND p.id = work_products.project_id
            AND p.project_status_workflow IN ('Production in Progress', 'AI Verified', 'Under Manual Revision')
        )
    );

CREATE POLICY "Users can update work products for their projects" ON work_products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
            WHERE fp.user_id = auth.uid()
            AND p.id = work_products.project_id
            AND p.project_status_workflow IN ('Production in Progress', 'AI Verified', 'Under Manual Revision')
        )
    );

-- 11. Create trigger to automatically update version numbers
CREATE OR REPLACE FUNCTION update_work_product_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new work product, set the version number
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM work_products
        WHERE project_id = NEW.project_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_work_product_version ON work_products;
CREATE TRIGGER trigger_update_work_product_version
    BEFORE INSERT ON work_products
    FOR EACH ROW
    EXECUTE FUNCTION update_work_product_version();

-- 12. Test the new functionality
SELECT 'Re-upload support enabled successfully' as status;

-- Verify the new constraints and functions
SELECT 
    'work_products' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN upload_status = 'Uploaded' THEN 1 END) as active_uploads,
    COUNT(CASE WHEN upload_status = 'Archived' THEN 1 END) as archived_uploads
FROM work_products;

-- Show the new functions
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%work_product%'
ORDER BY routine_name; 