-- =============================================================================
-- CHECK TABLE COLUMN STRUCTURE
-- =============================================================================
-- This script checks the actual column structure of all tables
-- before creating the deletion script
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

-- Check sample data to understand relationships
SELECT 'SAMPLE DATA ANALYSIS' as section;

-- Check if target emails exist and their IDs
SELECT 'TARGET EMAILS IN CLIENT_PROFILES' as info;
SELECT email, client_id, user_id 
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

SELECT 'TARGET EMAILS IN FREELANCER_PROFILES' as info;
SELECT email, freelancer_id, user_id 
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

SELECT 'TARGET EMAILS IN AUTH.USERS' as info;
SELECT email, id 
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- Check sample projects to understand project structure
SELECT 'SAMPLE PROJECTS STRUCTURE' as info;
SELECT 
    id,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status
FROM projects 
LIMIT 3;

-- Check sample work_products to understand structure
SELECT 'SAMPLE WORK_PRODUCTS STRUCTURE' as info;
SELECT 
    id,
    project_id,
    file_name,
    file_path
FROM work_products 
LIMIT 3;

-- Check sample verification_reports to understand structure
SELECT 'SAMPLE VERIFICATION_REPORTS STRUCTURE' as info;
SELECT 
    id,
    project_id,
    file_name,
    file_path
FROM verification_reports 
LIMIT 3;

-- Check sample deliverables to understand structure
SELECT 'SAMPLE DELIVERABLES STRUCTURE' as info;
SELECT 
    id,
    project_id,
    deliverable_text
FROM deliverables 
LIMIT 3;

-- Check sample project_messages to understand structure
SELECT 'SAMPLE PROJECT_MESSAGES STRUCTURE' as info;
SELECT 
    id,
    project_id,
    sender_id,
    receiver_id
FROM project_messages 
LIMIT 3;

-- Check sample transactions to understand structure
SELECT 'SAMPLE TRANSACTIONS STRUCTURE' as info;
SELECT 
    id,
    transaction_id,
    project_id,
    client_id,
    freelancer_id,
    amount
FROM transactions 
LIMIT 3;
