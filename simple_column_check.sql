-- =============================================================================
-- SIMPLE COLUMN STRUCTURE CHECK
-- =============================================================================
-- This script checks the actual column structure of all tables
-- without trying to access specific columns that might not exist
-- =============================================================================

-- Check client_profiles table structure
SELECT 'CLIENT_PROFILES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check freelancer_profiles table structure
SELECT 'FREELANCER_PROFILES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check projects table structure
SELECT 'PROJECTS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check work_products table structure
SELECT 'WORK_PRODUCTS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check verification_reports table structure
SELECT 'VERIFICATION_REPORTS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check deliverables table structure
SELECT 'DELIVERABLES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deliverables' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check project_messages table structure
SELECT 'PROJECT_MESSAGES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check transactions table structure
SELECT 'TRANSACTIONS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key relationships
SELECT 'FOREIGN KEY RELATIONSHIPS' as section;
SELECT 
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check if target emails exist (simple check)
SELECT 'TARGET EMAILS CHECK' as section;

-- Check client_profiles for target emails
SELECT 'CLIENT_PROFILES - Target emails found:' as info;
SELECT COUNT(*) as count 
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check freelancer_profiles for target emails
SELECT 'FREELANCER_PROFILES - Target emails found:' as info;
SELECT COUNT(*) as count 
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check auth.users for target emails
SELECT 'AUTH.USERS - Target emails found:' as info;
SELECT COUNT(*) as count 
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check record counts in each table
SELECT 'RECORD COUNTS' as section;

SELECT 'client_profiles' as table_name, COUNT(*) as record_count FROM client_profiles
UNION ALL
SELECT 'freelancer_profiles' as table_name, COUNT(*) as record_count FROM freelancer_profiles
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'work_products' as table_name, COUNT(*) as record_count FROM work_products
UNION ALL
SELECT 'verification_reports' as table_name, COUNT(*) as record_count FROM verification_reports
UNION ALL
SELECT 'deliverables' as table_name, COUNT(*) as record_count FROM deliverables
UNION ALL
SELECT 'project_messages' as table_name, COUNT(*) as record_count FROM project_messages
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as record_count FROM transactions;
