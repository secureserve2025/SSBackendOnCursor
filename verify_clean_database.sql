-- Verify database state after project data deletion
-- This script checks what data remains and what was deleted

-- TABLES THAT SHOULD STILL HAVE DATA (User/Auth related):
SELECT '=== TABLES WITH DATA (Should be preserved) ===' as info;

SELECT 'client_profiles' as table_name, COUNT(*) as record_count FROM client_profiles
UNION ALL
SELECT 'freelancer_profiles' as table_name, COUNT(*) as record_count FROM freelancer_profiles
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles;

-- TABLES THAT SHOULD BE EMPTY (Project related):
SELECT '=== TABLES THAT SHOULD BE EMPTY ===' as info;

SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'deliverables' as table_name, COUNT(*) as record_count FROM deliverables
UNION ALL
SELECT 'project_files' as table_name, COUNT(*) as record_count FROM project_files
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as record_count FROM messages
UNION ALL
SELECT 'work_products' as table_name, COUNT(*) as record_count FROM work_products
UNION ALL
SELECT 'verification_reports' as table_name, COUNT(*) as record_count FROM verification_reports;

-- Show sample user data to confirm it's intact
SELECT '=== SAMPLE USER DATA (Should be preserved) ===' as info;

SELECT 
    'client_profiles' as table_name,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as clients_with_email
FROM client_profiles;

SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as total_freelancers,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as freelancers_with_email
FROM freelancer_profiles;

-- Show all tables in the database
SELECT '=== ALL TABLES IN DATABASE ===' as info;

SELECT 
    table_name,
    COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
GROUP BY table_name
ORDER BY table_name; 