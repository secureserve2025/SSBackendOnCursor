-- Check if any files were uploaded to storage recently
-- This will help us see if the upload is working but database save is failing

-- 1. Check recent files in project-files bucket
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'project-files' 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if any files exist in project_files table
SELECT 
    id,
    project_id,
    file_name,
    file_type,
    file_size,
    uploaded_at,
    created_at
FROM project_files 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check recent projects that should have files
SELECT 
    p.id as project_id,
    p.project_name,
    p.created_at as project_created,
    COUNT(pf.id) as file_count
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
WHERE p.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY p.id, p.project_name, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Check if the bucket is still public
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'project-files';
