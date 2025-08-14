-- Diagnostic script to check project files system status
-- Run this to understand the current state of file uploads

-- 1. Check if storage bucket exists
SELECT 
    'Storage Bucket Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-files') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-files') 
        THEN 'Storage bucket is properly configured'
        ELSE 'Storage bucket "project-files" does not exist - this is the root cause of file upload failures'
    END as details;

-- 2. Check project_files table structure
SELECT 
    'Project Files Table' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') 
        THEN 'Table structure is correct'
        ELSE 'project_files table does not exist'
    END as details;

-- 3. Check RLS policies on project_files table
SELECT 
    'RLS Policies (project_files)' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN 'COMPLETE'
        WHEN COUNT(*) > 0 THEN 'PARTIAL'
        ELSE 'MISSING'
    END as status,
    'Found ' || COUNT(*) || ' RLS policies on project_files table' as details
FROM pg_policies 
WHERE tablename = 'project_files';

-- 4. Check storage policies
SELECT 
    'Storage Policies' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN 'COMPLETE'
        WHEN COUNT(*) > 0 THEN 'PARTIAL'
        ELSE 'MISSING'
    END as status,
    'Found ' || COUNT(*) || ' storage policies for project-files bucket' as details
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 5. Check existing project files data
SELECT 
    'Existing Project Files' as check_type,
    COUNT(*) as file_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'DATA EXISTS'
        ELSE 'NO DATA'
    END as status,
    'Found ' || COUNT(*) || ' files in project_files table' as details
FROM project_files;

-- 6. Check recent projects without files
SELECT 
    'Recent Projects Without Files' as check_type,
    COUNT(*) as project_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'ISSUE DETECTED'
        ELSE 'ALL GOOD'
    END as status,
    'Found ' || COUNT(*) || ' recent projects without associated files' as details
FROM projects p
WHERE p.created_at > NOW() - INTERVAL '7 days'
AND NOT EXISTS (SELECT 1 FROM project_files pf WHERE pf.project_id = p.id);

-- 7. Detailed list of recent projects and their file status
SELECT 
    p.project_id,
    p.project_name,
    p.created_at,
    COUNT(pf.id) as file_count,
    CASE 
        WHEN COUNT(pf.id) > 0 THEN 'HAS FILES'
        ELSE 'NO FILES'
    END as file_status
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
WHERE p.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.project_id, p.project_name, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;

