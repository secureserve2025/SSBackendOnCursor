-- Delete all projects with "Project Created" status and their related records
-- This script will clean up projects that should not be visible to freelancers

-- First, let's see what projects we're going to delete
SELECT 
    id,
    project_id,
    project_name,
    client_id,
    freelancer_id,
    project_status_workflow,
    created_at
FROM projects 
WHERE project_status_workflow = 'Project Created'
ORDER BY created_at DESC;

-- Count how many projects will be affected
SELECT 
    COUNT(*) as projects_to_delete,
    COUNT(DISTINCT freelancer_id) as unique_freelancers_affected
FROM projects 
WHERE project_status_workflow = 'Project Created';

-- Delete related records first (in order of dependencies)
-- 1. Delete verification reports
DELETE FROM verification_reports 
WHERE project_id IN (
    SELECT id FROM projects WHERE project_status_workflow = 'Project Created'
);

-- 2. Delete work products
DELETE FROM work_products 
WHERE project_id IN (
    SELECT id FROM projects WHERE project_status_workflow = 'Project Created'
);

-- 3. Delete deliverables
DELETE FROM deliverables 
WHERE project_id IN (
    SELECT id FROM projects WHERE project_status_workflow = 'Project Created'
);

-- 4. Delete project files
DELETE FROM project_files 
WHERE project_id IN (
    SELECT id FROM projects WHERE project_status_workflow = 'Project Created'
);

-- 5. Delete messages
DELETE FROM messages 
WHERE project_id IN (
    SELECT id FROM projects WHERE project_status_workflow = 'Project Created'
);

-- 6. Delete transactions
DELETE FROM transactions 
WHERE project_id IN (
    SELECT id FROM projects WHERE project_status_workflow = 'Project Created'
);

-- 7. Finally, delete the projects themselves
DELETE FROM projects 
WHERE project_status_workflow = 'Project Created';

-- Verify deletion
SELECT 
    COUNT(*) as remaining_projects_with_created_status
FROM projects 
WHERE project_status_workflow = 'Project Created';

-- Show remaining projects for each freelancer
SELECT 
    freelancer_id,
    COUNT(*) as project_count,
    STRING_AGG(project_id, ', ') as project_ids
FROM projects 
GROUP BY freelancer_id
ORDER BY project_count DESC; 