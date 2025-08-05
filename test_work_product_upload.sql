-- Test Work Product Upload Functionality
-- This script tests the work_products table and upload functionality

-- 1. Check if work_products table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_products'
ORDER BY ordinal_position;

-- 2. Check if work-products storage bucket exists
-- Note: This would need to be checked in Supabase dashboard
-- For now, we'll just verify the table structure

-- 3. Test inserting a sample work product record
INSERT INTO work_products (
    project_id,
    file_name,
    file_path,
    file_size,
    file_type,
    video_duration,
    video_resolution,
    video_format,
    upload_status
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Test project ID
    'test_video.mp4',
    'test_user/test_project/test_video.mp4',
    5242880, -- 5MB
    'video/mp4',
    120, -- 2 minutes
    '1920x1080',
    'MP4',
    'Uploaded'
) ON CONFLICT DO NOTHING;

-- 4. Verify the insert worked
SELECT * FROM work_products 
WHERE file_name = 'test_video.mp4';

-- 5. Check work_products for a specific project (replace with actual project ID)
-- SELECT * FROM work_products WHERE project_id = 'your-project-id-here';

-- 6. Clean up test data
DELETE FROM work_products 
WHERE file_name = 'test_video.mp4';

-- 7. Verify cleanup
SELECT COUNT(*) as remaining_test_records 
FROM work_products 
WHERE file_name = 'test_video.mp4';

-- 8. Check projects that have work products
SELECT 
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    COUNT(wp.id) as work_product_count
FROM projects p
LEFT JOIN work_products wp ON p.id = wp.project_id
GROUP BY p.id, p.project_id, p.project_name, p.project_status_workflow
HAVING COUNT(wp.id) > 0
ORDER BY p.created_at DESC;

-- 9. Check projects in "Production in Progress" status (eligible for upload)
SELECT 
    p.project_id,
    p.project_name,
    p.freelancer_id,
    p.project_status_workflow,
    COUNT(wp.id) as existing_work_products
FROM projects p
LEFT JOIN work_products wp ON p.id = wp.project_id
WHERE p.project_status_workflow = 'Production in Progress'
GROUP BY p.id, p.project_id, p.project_name, p.freelancer_id, p.project_status_workflow
ORDER BY p.created_at DESC; 