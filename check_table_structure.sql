-- =============================================================================
-- CHECK TABLE STRUCTURE SCRIPT
-- =============================================================================
-- This script checks the actual structure of tables in your database
-- to understand what columns exist before creating the deletion script
-- =============================================================================

-- Check work_products table structure
SELECT 'WORK_PRODUCTS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_products'
ORDER BY ordinal_position;

-- Check verification_reports table structure
SELECT 'VERIFICATION_REPORTS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports'
ORDER BY ordinal_position;

-- Check messages table structure
SELECT 'MESSAGES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Check transactions table structure
SELECT 'TRANSACTIONS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Check projects table structure
SELECT 'PROJECTS TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Check client_profiles table structure
SELECT 'CLIENT_PROFILES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_profiles'
ORDER BY ordinal_position;

-- Check freelancer_profiles table structure
SELECT 'FREELANCER_PROFILES TABLE STRUCTURE' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles'
ORDER BY ordinal_position;

-- Check if tables exist
SELECT 'TABLE EXISTENCE CHECK' as check_type;
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'work_products', 
    'verification_reports', 
    'messages', 
    'transactions', 
    'projects', 
    'client_profiles', 
    'freelancer_profiles'
)
ORDER BY table_name;

