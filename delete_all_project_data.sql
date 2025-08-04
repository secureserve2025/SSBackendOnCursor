-- Delete ALL project-related data from the database
-- This will preserve user profiles, authentication, and login records
-- WARNING: This will permanently delete all project data

-- First, let's see what we're about to delete
SELECT 'Projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'Deliverables' as table_name, COUNT(*) as record_count FROM deliverables
UNION ALL
SELECT 'Project Files' as table_name, COUNT(*) as record_count FROM project_files
UNION ALL
SELECT 'Transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'Messages' as table_name, COUNT(*) as record_count FROM messages
UNION ALL
SELECT 'Work Products' as table_name, COUNT(*) as record_count FROM work_products
UNION ALL
SELECT 'Verification Reports' as table_name, COUNT(*) as record_count FROM verification_reports;

-- Show current project data before deletion
SELECT 
    'Current Projects' as info,
    COUNT(*) as total_projects,
    COUNT(CASE WHEN project_status_workflow = 'Project Created' THEN 1 END) as project_created,
    COUNT(CASE WHEN project_status_workflow = 'Fund Secured' THEN 1 END) as fund_secured,
    COUNT(CASE WHEN project_status_workflow = 'Production in Progress' THEN 1 END) as production_in_progress
FROM projects;

-- DELETE ALL PROJECT-RELATED DATA
-- Delete in order of dependencies to avoid foreign key constraint violations

-- 1. Delete verification reports (depends on projects)
DELETE FROM verification_reports;

-- 2. Delete work products (depends on projects)
DELETE FROM work_products;

-- 3. Delete deliverables (depends on projects)
DELETE FROM deliverables;

-- 4. Delete project files (depends on projects)
DELETE FROM project_files;

-- 5. Delete messages (depends on projects)
DELETE FROM messages;

-- 6. Delete transactions (depends on projects)
DELETE FROM transactions;

-- 7. Finally, delete all projects
DELETE FROM projects;

-- Verify all project data is deleted
SELECT 'Verification - Projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'Verification - Deliverables' as table_name, COUNT(*) as record_count FROM deliverables
UNION ALL
SELECT 'Verification - Project Files' as table_name, COUNT(*) as record_count FROM project_files
UNION ALL
SELECT 'Verification - Transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'Verification - Messages' as table_name, COUNT(*) as record_count FROM messages
UNION ALL
SELECT 'Verification - Work Products' as table_name, COUNT(*) as record_count FROM work_products
UNION ALL
SELECT 'Verification - Verification Reports' as table_name, COUNT(*) as record_count FROM verification_reports;

-- Verify user profiles and authentication data are preserved
SELECT 'User Profiles Preserved' as info, COUNT(*) as user_count FROM profiles;

-- Show remaining data structure
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 