-- Diagnose Escrow Funding Issue
-- This script checks the existing table structure and relationships without making any changes

-- 1. Check current projects table structure
SELECT '=== CURRENT PROJECTS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Check foreign key relationships for projects table
SELECT '=== FOREIGN KEY RELATIONSHIPS FOR PROJECTS ===' as section;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='projects';

-- 3. Check client_profiles table structure
SELECT '=== CLIENT_PROFILES TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_profiles'
ORDER BY ordinal_position;

-- 4. Check freelancer_profiles table structure
SELECT '=== FREELANCER_PROFILES TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles'
ORDER BY ordinal_position;

-- 5. Check transactions table structure
SELECT '=== TRANSACTIONS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 6. Check if RPC functions exist
SELECT '=== EXISTING RPC FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('get_client_projects_display', 'get_client_projects_for_escrow')
ORDER BY routine_name;

-- 7. Check sample data in projects table
SELECT '=== SAMPLE PROJECTS DATA ===' as section;
SELECT 
    id,
    project_name,
    client_id,
    freelancer_id,
    status,
    created_at
FROM projects 
LIMIT 5;

-- 8. Check if project_status_workflow column exists and has data
SELECT '=== PROJECT STATUS WORKFLOW CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
        ) THEN '✅ Column exists'
        ELSE '❌ Column missing'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
        ) THEN (
            SELECT COUNT(*) FROM projects WHERE project_status_workflow IS NOT NULL
        )::TEXT
        ELSE 'N/A'
    END as projects_with_status;

-- 9. Check if project_id column exists
SELECT '=== PROJECT_ID COLUMN CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'project_id'
        ) THEN '✅ Column exists'
        ELSE '❌ Column missing'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'project_id'
        ) THEN (
            SELECT COUNT(*) FROM projects WHERE project_id IS NOT NULL
        )::TEXT
        ELSE 'N/A'
    END as projects_with_id;

-- 10. Check projects with "Checklist Signed off" status
SELECT '=== PROJECTS WITH CHECKLIST SIGNED OFF STATUS ===' as section;
SELECT 
    p.id,
    p.project_name,
    p.status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
        ) THEN p.project_status_workflow
        ELSE 'Column not found'
    END as project_status_workflow,
    cp.client_id as client_profile_id,
    cp.full_name as client_name
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE 
    (EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
    ) AND p.project_status_workflow = 'Checklist Signed off')
    OR p.status = 'Checklist Signed off'
ORDER BY p.created_at DESC;

-- 11. Check transactions for these projects
SELECT '=== TRANSACTIONS FOR CHECKLIST SIGNED OFF PROJECTS ===' as section;
SELECT 
    t.id,
    t.project_id,
    t.amount,
    t.status as transaction_status,
    p.project_name,
    p.status as project_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
        ) THEN p.project_status_workflow
        ELSE 'Column not found'
    END as project_status_workflow
FROM transactions t
JOIN projects p ON t.project_id = p.id
WHERE 
    (EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
    ) AND p.project_status_workflow = 'Checklist Signed off')
    OR p.status = 'Checklist Signed off'
ORDER BY t.created_at DESC;

-- 12. Test direct query to see what works
SELECT '=== TESTING DIRECT QUERY ===' as section;
SELECT 
    p.id,
    p.project_name,
    cp.client_id as client_profile_id,
    cp.full_name as client_name,
    fp.freelancer_id,
    fp.full_name as freelancer_name
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE cp.user_id = 'df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID
LIMIT 3;

-- 13. Check what status values exist in projects
SELECT '=== AVAILABLE STATUS VALUES ===' as section;
SELECT 
    'projects.status' as column_name,
    status,
    COUNT(*) as count
FROM projects 
GROUP BY status
UNION ALL
SELECT 
    'projects.project_status_workflow' as column_name,
    project_status_workflow,
    COUNT(*) as count
FROM projects 
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
)
GROUP BY project_status_workflow;

-- 14. Check what transaction status values exist
SELECT '=== AVAILABLE TRANSACTION STATUS VALUES ===' as section;
SELECT 
    status,
    COUNT(*) as count
FROM transactions 
GROUP BY status;

-- 15. Final summary
SELECT '=== DIAGNOSTIC SUMMARY ===' as section;
SELECT 
    'Projects table columns' as check_type,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'projects')::TEXT as value
UNION ALL
SELECT 
    'Projects with client_id' as check_type,
    (SELECT COUNT(*) FROM projects WHERE client_id IS NOT NULL)::TEXT as value
UNION ALL
SELECT 
    'Projects with freelancer_id' as check_type,
    (SELECT COUNT(*) FROM projects WHERE freelancer_id IS NOT NULL)::TEXT as value
UNION ALL
SELECT 
    'Total transactions' as check_type,
    (SELECT COUNT(*) FROM transactions)::TEXT as value
UNION ALL
SELECT 
    'RPC functions found' as check_type,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_name IN ('get_client_projects_display', 'get_client_projects_for_escrow'))::TEXT as value;



