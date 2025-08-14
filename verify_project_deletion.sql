-- Verify Project Deletion
-- This script verifies that the project was actually deleted and checks for any remaining related records

-- Check if the project still exists
SELECT 
    'Project Status' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM projects WHERE id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5') 
        THEN '❌ Project still exists' 
        ELSE '✅ Project successfully deleted' 
    END as result;

-- Check for any remaining related records
SELECT 
    'Related Records Check' as check_type,
    'project_files' as table_name,
    COUNT(*) as remaining_records
FROM project_files 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'

UNION ALL

SELECT 
    'Related Records Check' as check_type,
    'deliverables' as table_name,
    COUNT(*) as remaining_records
FROM deliverables 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'

UNION ALL

SELECT 
    'Related Records Check' as check_type,
    'transactions' as table_name,
    COUNT(*) as remaining_records
FROM transactions 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'

UNION ALL

SELECT 
    'Related Records Check' as check_type,
    'messages' as table_name,
    COUNT(*) as remaining_records
FROM messages 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'

UNION ALL

SELECT 
    'Related Records Check' as check_type,
    'work_products' as table_name,
    COUNT(*) as remaining_records
FROM work_products 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'

UNION ALL

SELECT 
    'Related Records Check' as check_type,
    'verification_reports' as table_name,
    COUNT(*) as remaining_records
FROM verification_reports 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'

UNION ALL

SELECT 
    'Related Records Check' as check_type,
    'project_status_history' as table_name,
    COUNT(*) as remaining_records
FROM project_status_history 
WHERE project_id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5';

-- Show current projects for the client
SELECT 
    'Current Projects' as check_type,
    id,
    project_id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
WHERE client_id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'
ORDER BY created_at DESC;











