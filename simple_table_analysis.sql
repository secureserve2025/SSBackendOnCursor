-- =============================================================================
-- SIMPLE TABLE ANALYSIS FOR DELETION SCRIPT
-- =============================================================================
-- This script analyzes the essential table structure needed for user deletion
-- =============================================================================

-- =============================================================================
-- PART 1: ALL TABLES IN PUBLIC SCHEMA
-- =============================================================================

SELECT 'ALL TABLES IN PUBLIC SCHEMA' as section_header;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- PART 2: COLUMN ANALYSIS FOR KEY TABLES
-- =============================================================================

SELECT 'COLUMN ANALYSIS FOR KEY TABLES' as section_header;

-- Check client_profiles table
SELECT 'client_profiles' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check freelancer_profiles table
SELECT 'freelancer_profiles' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check projects table
SELECT 'projects' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if work_products table exists and its structure
SELECT 'work_products' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if verification_reports table exists and its structure
SELECT 'verification_reports' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'verification_reports' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if messages table exists and its structure
SELECT 'messages' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if transactions table exists and its structure
SELECT 'transactions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- PART 3: FOREIGN KEY RELATIONSHIPS
-- =============================================================================

SELECT 'FOREIGN KEY RELATIONSHIPS' as section_header;

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

-- =============================================================================
-- PART 4: SAMPLE DATA CHECK
-- =============================================================================

SELECT 'SAMPLE DATA CHECK' as section_header;

-- Check if target emails exist in client_profiles
SELECT 'client_profiles' as table_name, COUNT(*) as record_count
FROM client_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
UNION ALL
SELECT 'freelancer_profiles' as table_name, COUNT(*) as record_count
FROM freelancer_profiles 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com')
UNION ALL
SELECT 'auth.users' as table_name, COUNT(*) as record_count
FROM auth.users 
WHERE email IN ('sd@gmail.com', 'freelancer@gmail.com', 'freelancer1@gmail.com');

-- =============================================================================
-- FINAL MESSAGE
-- =============================================================================

SELECT 'SIMPLE TABLE ANALYSIS COMPLETED' as final_status;
SELECT 'This analysis shows the essential table structure for creating the deletion script.' as instruction;



