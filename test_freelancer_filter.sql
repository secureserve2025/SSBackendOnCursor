-- Test Freelancer Projects Filter
-- Run this in Supabase SQL Editor to verify the filter works

-- Check all projects for the specific freelancer
SELECT 
    'All Projects for Freelancer' as check_type,
    id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
WHERE freelancer_id = '2393480d-7be6-4dd5-8093-45b4bbe38048'
ORDER BY created_at DESC;

-- Check filtered projects (excluding "Project Created")
SELECT 
    'Filtered Projects (Excluding Project Created)' as check_type,
    id,
    project_name,
    project_status_workflow,
    created_at
FROM projects 
WHERE freelancer_id = '2393480d-7be6-4dd5-8093-45b4bbe38048'
AND project_status_workflow != 'Project Created'
ORDER BY created_at DESC;









