-- Debug script to test file upload system
-- Run this to check the current state

-- 1. Check if storage bucket exists
SELECT 
    'Storage Bucket Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-files') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as result;

-- 2. Check project_files table
SELECT 
    'Project Files Table Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as result;

-- 3. Check recent projects
SELECT 
    'Recent Projects' as test_name,
    COUNT(*) as count,
    'Found ' || COUNT(*) || ' projects created in last 24 hours' as result
FROM projects 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 4. Check if any projects have files
SELECT 
    'Projects with Files' as test_name,
    COUNT(DISTINCT p.id) as count,
    'Found ' || COUNT(DISTINCT p.id) || ' projects with files' as result
FROM projects p
INNER JOIN project_files pf ON p.id = pf.project_id
WHERE p.created_at > NOW() - INTERVAL '24 hours';

-- 5. Check recent project files
SELECT 
    'Recent Project Files' as test_name,
    COUNT(*) as count,
    'Found ' || COUNT(*) || ' files uploaded in last 24 hours' as result
FROM project_files 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 6. Show recent projects and their file status
SELECT 
    p.project_id,
    p.project_name,
    p.created_at,
    COUNT(pf.id) as file_count,
    CASE 
        WHEN COUNT(pf.id) > 0 THEN '✅ HAS FILES'
        ELSE '❌ NO FILES'
    END as file_status
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
GROUP BY p.id, p.project_id, p.project_name, p.created_at
ORDER BY p.created_at DESC
LIMIT 5;
