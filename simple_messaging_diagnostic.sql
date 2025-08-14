-- =============================================================================
-- SIMPLE MESSAGING DIAGNOSTIC
-- Run each section separately to see the results
-- =============================================================================

-- SECTION 1: Check if tables exist and have data
SELECT 'PROJECTS TABLE' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'FREELANCER_PROFILES TABLE', COUNT(*) FROM freelancer_profiles
UNION ALL
SELECT 'CLIENT_PROFILES TABLE', COUNT(*) FROM client_profiles
UNION ALL
SELECT 'MESSAGES TABLE', COUNT(*) FROM messages;

-- SECTION 2: Check projects table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- SECTION 3: Check all projects with their status
SELECT 
    id,
    project_id,
    project_name,
    project_status_workflow,
    client_id,
    freelancer_id,
    created_at
FROM projects 
ORDER BY created_at DESC;

-- SECTION 4: Check projects with "Checklist Signed off" status
SELECT 
    id,
    project_id,
    project_name,
    project_status_workflow,
    client_id,
    freelancer_id
FROM projects 
WHERE project_status_workflow = 'Checklist Signed off';

-- SECTION 5: Check sample freelancer profiles
SELECT 
    id,
    user_id,
    freelancer_id,
    full_name,
    email
FROM freelancer_profiles 
LIMIT 5;

-- SECTION 6: Check sample client profiles
SELECT 
    id,
    user_id,
    client_id,
    full_name,
    email
FROM client_profiles 
LIMIT 5;

-- SECTION 7: Check if there are any projects assigned to freelancers
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    p.freelancer_id,
    fp.full_name as freelancer_name
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE p.freelancer_id IS NOT NULL
LIMIT 10;
