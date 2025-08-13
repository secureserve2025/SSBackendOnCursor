-- Simple Project Check
-- Run this in Supabase SQL Editor

SELECT 'Total Projects' as check_type, COUNT(*) as count FROM projects;

SELECT 
    'Client Projects' as check_type,
    id,
    project_name,
    client_id,
    freelancer_id,
    project_status_workflow,
    created_at
FROM projects 
WHERE client_id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'
ORDER BY created_at DESC;
