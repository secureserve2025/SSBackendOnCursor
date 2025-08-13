-- Comprehensive Work Product Upload System Fix
-- This script ensures the work product upload system works correctly for both initial uploads and re-uploads

-- 1. Check current work_products table structure
SELECT '=== CURRENT WORK_PRODUCTS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_products'
ORDER BY ordinal_position;

-- 2. Create or update work_products table with all required columns
CREATE TABLE IF NOT EXISTS work_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    video_duration INTEGER,
    video_resolution VARCHAR(50),
    video_format VARCHAR(20),
    upload_status VARCHAR(50) DEFAULT 'Uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add missing columns to work_products table if they don't exist
DO $$ 
BEGIN
    -- Add video_duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_products' AND column_name = 'video_duration'
    ) THEN
        ALTER TABLE work_products ADD COLUMN video_duration INTEGER;
    END IF;
    
    -- Add video_resolution column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_products' AND column_name = 'video_resolution'
    ) THEN
        ALTER TABLE work_products ADD COLUMN video_resolution VARCHAR(50);
    END IF;
    
    -- Add video_format column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_products' AND column_name = 'video_format'
    ) THEN
        ALTER TABLE work_products ADD COLUMN video_format VARCHAR(20);
    END IF;
    
    -- Add upload_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_products' AND column_name = 'upload_status'
    ) THEN
        ALTER TABLE work_products ADD COLUMN upload_status VARCHAR(50) DEFAULT 'Uploaded';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_products' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE work_products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_products_project_id ON work_products(project_id);
CREATE INDEX IF NOT EXISTS idx_work_products_upload_status ON work_products(upload_status);
CREATE INDEX IF NOT EXISTS idx_work_products_created_at ON work_products(created_at);

-- 5. Enable RLS on work_products table
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for work_products table
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
CREATE POLICY "Users can view work products for their projects" ON work_products
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

DROP POLICY IF EXISTS "Freelancers can create work products for their projects" ON work_products;
CREATE POLICY "Freelancers can create work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Freelancers can update work products for their projects" ON work_products;
CREATE POLICY "Freelancers can update work products for their projects" ON work_products
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

-- 7. Create function to check if project can have work products uploaded
CREATE OR REPLACE FUNCTION can_upload_work_product(project_uuid UUID)
RETURNS TABLE (
    can_upload BOOLEAN,
    reason TEXT,
    current_status VARCHAR(100),
    freelancer_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p.project_status_workflow = 'Production in Progress' THEN true
            ELSE false
        END as can_upload,
        CASE 
            WHEN p.project_status_workflow = 'Production in Progress' THEN 'Project is in production phase'
            ELSE 'Project status must be "Production in Progress" to upload work products'
        END as reason,
        p.project_status_workflow as current_status,
        p.freelancer_id
    FROM projects p
    WHERE p.id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get latest work product for a project
CREATE OR REPLACE FUNCTION get_latest_work_product(project_uuid UUID)
RETURNS TABLE (
    id UUID,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(100),
    video_duration INTEGER,
    video_resolution VARCHAR(50),
    video_format VARCHAR(20),
    upload_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wp.id,
        wp.file_name,
        wp.file_path,
        wp.file_size,
        wp.file_type,
        wp.video_duration,
        wp.video_resolution,
        wp.video_format,
        wp.upload_status,
        wp.created_at
    FROM work_products wp
    WHERE wp.project_id = project_uuid
    AND wp.upload_status = 'Uploaded'
    ORDER BY wp.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to archive work product
CREATE OR REPLACE FUNCTION archive_work_product(work_product_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE work_products 
    SET 
        upload_status = 'Archived',
        updated_at = NOW()
    WHERE id = work_product_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to validate work product upload
CREATE OR REPLACE FUNCTION validate_work_product_upload(
    project_uuid UUID,
    file_size BIGINT,
    file_type VARCHAR(100)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT,
    max_size BIGINT,
    supported_types TEXT[]
) AS $$
BEGIN
    -- Check file size (50MB limit)
    IF file_size > 50 * 1024 * 1024 THEN
        RETURN QUERY SELECT 
            false as is_valid,
            'File size must be less than 50MB' as error_message,
            50 * 1024 * 1024 as max_size,
            ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'] as supported_types;
        RETURN;
    END IF;
    
    -- Check file type
    IF file_type NOT IN ('video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm') THEN
        RETURN QUERY SELECT 
            false as is_valid,
            'Unsupported file type. Please use MP4, AVI, MOV, WMV, FLV, or WebM' as error_message,
            50 * 1024 * 1024 as max_size,
            ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'] as supported_types;
        RETURN;
    END IF;
    
    -- Check project status
    IF NOT EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_uuid 
        AND project_status_workflow = 'Production in Progress'
    ) THEN
        RETURN QUERY SELECT 
            false as is_valid,
            'Work products can only be uploaded for projects in "Production in Progress" status' as error_message,
            50 * 1024 * 1024 as max_size,
            ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'] as supported_types;
        RETURN;
    END IF;
    
    -- All validations passed
    RETURN QUERY SELECT 
        true as is_valid,
        'File is valid for upload' as error_message,
        50 * 1024 * 1024 as max_size,
        ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'] as supported_types;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant execute permissions
GRANT EXECUTE ON FUNCTION can_upload_work_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_work_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_work_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_work_product_upload(UUID, BIGINT, VARCHAR) TO authenticated;

-- 12. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_work_products_updated_at ON work_products;
CREATE TRIGGER trigger_update_work_products_updated_at
    BEFORE UPDATE ON work_products
    FOR EACH ROW
    EXECUTE FUNCTION update_work_products_updated_at();

-- 13. Test the functions
SELECT '=== TESTING WORK PRODUCT FUNCTIONS ===' as section;

-- Test validation function
SELECT 'Validation function test:' as test_type;
SELECT * FROM validate_work_product_upload(
    '00000000-0000-0000-0000-000000000000'::UUID,
    10 * 1024 * 1024, -- 10MB
    'video/mp4'
);

-- 14. Check existing work products
SELECT '=== EXISTING WORK PRODUCTS ===' as section;
SELECT 
    COUNT(*) as total_work_products,
    COUNT(CASE WHEN upload_status = 'Uploaded' THEN 1 END) as active_uploads,
    COUNT(CASE WHEN upload_status = 'Archived' THEN 1 END) as archived_uploads,
    COUNT(CASE WHEN video_duration IS NOT NULL THEN 1 END) as with_duration,
    COUNT(CASE WHEN video_resolution IS NOT NULL THEN 1 END) as with_resolution
FROM work_products;

-- 15. Show sample work products
SELECT '=== SAMPLE WORK PRODUCTS ===' as section;
SELECT 
    id,
    project_id,
    file_name,
    file_size,
    file_type,
    video_duration,
    video_resolution,
    video_format,
    upload_status,
    created_at
FROM work_products 
ORDER BY created_at DESC 
LIMIT 5;

-- 16. Final verification
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
    'Table structure' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products') 
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_products' AND column_name = 'upload_status')
        THEN '✅ Ready for uploads'
        ELSE '❌ Table structure incomplete'
    END as status
UNION ALL
SELECT 
    'RLS policies' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_products') 
        THEN '✅ Security configured'
        ELSE '❌ RLS policies missing'
    END as status
UNION ALL
SELECT 
    'Validation functions' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'validate_work_product_upload') 
        THEN '✅ Functions ready'
        ELSE '❌ Validation functions missing'
    END as status
UNION ALL
SELECT 
    'Storage bucket' as check_type,
    '⚠️ Verify work-products bucket exists in Supabase Storage' as status;



