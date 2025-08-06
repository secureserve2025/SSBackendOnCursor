-- Update project status for specific project IDs
-- Run this in Supabase SQL Editor

-- First, let's check the current status of these projects
SELECT 
    id,
    name,
    project_status_workflow,
    created_at,
    updated_at
FROM projects 
WHERE id IN ('V1003', 'V1004');

-- Update the project status to "Production in Progress"
UPDATE projects 
SET 
    project_status_workflow = 'Production in Progress',
    updated_at = NOW()
WHERE id IN ('V1003', 'V1004');

-- Verify the changes
SELECT 
    id,
    name,
    project_status_workflow,
    updated_at
FROM projects 
WHERE id IN ('V1003', 'V1004');

-- Optional: Check if any other projects have this status
SELECT 
    id,
    name,
    project_status_workflow,
    created_at
FROM projects 
WHERE project_status_workflow = 'Production in Progress'
ORDER BY updated_at DESC; 