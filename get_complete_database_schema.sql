-- Get Complete Database Schema Information
-- Run this script to get all table structures and relationships
-- Copy the entire output and share it

-- =============================================================================
-- PART 1: ALL TABLES AND THEIR COLUMNS
-- =============================================================================

SELECT 'DATABASE TABLES AND COLUMNS' as section_header;

-- Get all tables in the public schema
SELECT 'ALL TABLES IN DATABASE' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Get detailed column information for all tables
SELECT 'DETAILED COLUMN INFORMATION FOR ALL TABLES' as info;

SELECT 
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
)
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- PART 2: CONSTRAINTS AND RELATIONSHIPS
-- =============================================================================

SELECT 'EXISTING CONSTRAINTS' as section_header;

-- All constraints (primary keys, unique, foreign keys, check)
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Foreign key relationships (detailed)
SELECT 'FOREIGN KEY RELATIONSHIPS' as info;

SELECT 
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- PART 3: INDEXES
-- =============================================================================

SELECT 'DATABASE INDEXES' as section_header;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- PART 4: DATA SAMPLES AND COUNTS
-- =============================================================================

SELECT 'DATA SAMPLES AND COUNTS' as section_header;

-- Table row counts
SELECT 'TABLE ROW COUNTS' as info;

SELECT 
    'client_profiles' as table_name,
    COUNT(*) as row_count
FROM client_profiles
UNION ALL
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as row_count
FROM freelancer_profiles
UNION ALL
SELECT 
    'projects' as table_name,
    COUNT(*) as row_count
FROM projects
UNION ALL
SELECT 
    'transactions' as table_name,
    COUNT(*) as row_count
FROM transactions
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as row_count
FROM messages
UNION ALL
SELECT 
    'deliverables' as table_name,
    COUNT(*) as row_count
FROM deliverables
UNION ALL
SELECT 
    'project_files' as table_name,
    COUNT(*) as row_count
FROM project_files
UNION ALL
SELECT 
    'work_products' as table_name,
    COUNT(*) as row_count
FROM work_products
ORDER BY table_name;

-- Sample data from key tables (first few rows)
SELECT 'CLIENT_PROFILES SAMPLE DATA (first 3 rows)' as sample_info;
SELECT 
    id, user_id, client_id, email, full_name, 
    mobile_number, created_at, updated_at
FROM client_profiles 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'FREELANCER_PROFILES SAMPLE DATA (first 3 rows)' as sample_info;
SELECT 
    id, user_id, freelancer_id, email, full_name, 
    mobile_number, created_at, updated_at
FROM freelancer_profiles 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'PROJECTS SAMPLE DATA (first 3 rows)' as sample_info;
SELECT 
    id, project_id, client_id, freelancer_id, project_name,
    project_status, created_at, updated_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 3;

-- =============================================================================
-- PART 5: DATA INTEGRITY ANALYSIS
-- =============================================================================

SELECT 'DATA INTEGRITY ANALYSIS' as section_header;

-- Check for orphaned projects (missing client references)
SELECT 'ORPHANED PROJECTS - MISSING CLIENT REFERENCES' as integrity_check;

SELECT 
    p.id,
    p.project_id,
    p.client_id,
    p.project_name,
    'Missing client reference' as issue
FROM projects p
LEFT JOIN client_profiles c1 ON p.client_id = c1.client_id
LEFT JOIN client_profiles c2 ON p.client_id = c2.user_id::text
WHERE c1.client_id IS NULL AND c2.user_id IS NULL
LIMIT 5;

-- Check for orphaned projects (missing freelancer references)
SELECT 'ORPHANED PROJECTS - MISSING FREELANCER REFERENCES' as integrity_check;

SELECT 
    p.id,
    p.project_id,
    p.freelancer_id,
    p.project_name,
    'Missing freelancer reference' as issue
FROM projects p
LEFT JOIN freelancer_profiles f1 ON p.freelancer_id = f1.freelancer_id
LEFT JOIN freelancer_profiles f2 ON p.freelancer_id = f2.user_id::text
WHERE f1.freelancer_id IS NULL AND f2.user_id IS NULL
LIMIT 5;

-- Check ID patterns and data types
SELECT 'ID PATTERNS ANALYSIS' as patterns_info;

SELECT 'CLIENT_ID PATTERNS' as pattern_type,
    MIN(LENGTH(client_id)) as min_length,
    MAX(LENGTH(client_id)) as max_length,
    COUNT(DISTINCT client_id) as unique_count,
    COUNT(*) as total_count
FROM client_profiles
WHERE client_id IS NOT NULL
UNION ALL
SELECT 'FREELANCER_ID PATTERNS' as pattern_type,
    MIN(LENGTH(freelancer_id)) as min_length,
    MAX(LENGTH(freelancer_id)) as max_length,
    COUNT(DISTINCT freelancer_id) as unique_count,
    COUNT(*) as total_count
FROM freelancer_profiles
WHERE freelancer_id IS NOT NULL
UNION ALL
SELECT 'PROJECT CLIENT_ID PATTERNS' as pattern_type,
    MIN(LENGTH(client_id)) as min_length,
    MAX(LENGTH(client_id)) as max_length,
    COUNT(DISTINCT client_id) as unique_count,
    COUNT(*) as total_count
FROM projects
WHERE client_id IS NOT NULL
UNION ALL
SELECT 'PROJECT FREELANCER_ID PATTERNS' as pattern_type,
    MIN(LENGTH(freelancer_id)) as min_length,
    MAX(LENGTH(freelancer_id)) as max_length,
    COUNT(DISTINCT freelancer_id) as unique_count,
    COUNT(*) as total_count
FROM projects
WHERE freelancer_id IS NOT NULL;

-- Show example IDs to understand format
SELECT 'EXAMPLE ID FORMATS' as examples_info;

SELECT 'Client IDs' as id_type, client_id as example_id
FROM client_profiles 
WHERE client_id IS NOT NULL 
LIMIT 3
UNION ALL
SELECT 'Freelancer IDs' as id_type, freelancer_id as example_id
FROM freelancer_profiles 
WHERE freelancer_id IS NOT NULL 
LIMIT 3
UNION ALL
SELECT 'Project Client IDs' as id_type, client_id as example_id
FROM projects 
WHERE client_id IS NOT NULL 
LIMIT 3
UNION ALL
SELECT 'Project Freelancer IDs' as id_type, freelancer_id as example_id
FROM projects 
WHERE freelancer_id IS NOT NULL 
LIMIT 3;

-- =============================================================================
-- PART 6: AUTHENTICATION AND USER TABLES
-- =============================================================================

SELECT 'AUTHENTICATION ANALYSIS' as section_header;

-- Check auth.users connection
SELECT 'AUTH USERS CONNECTION CHECK' as auth_info;

-- Count profiles vs auth users
SELECT 'Profile vs Auth Users Count' as check_name,
    (SELECT COUNT(*) FROM client_profiles) as client_profiles_count,
    (SELECT COUNT(*) FROM freelancer_profiles) as freelancer_profiles_count;

-- Check if there are any auth.users entries (if accessible)
-- Note: This might not work depending on RLS policies
SELECT 'AUTH USERS SAMPLE' as auth_sample;
-- We'll use a safer approach since auth.users might be restricted

-- Check user_id patterns in profiles
SELECT 'USER_ID PATTERNS IN PROFILES' as user_id_info;

SELECT 'Client Profile user_ids' as profile_type,
    MIN(LENGTH(user_id::text)) as min_length,
    MAX(LENGTH(user_id::text)) as max_length,
    COUNT(*) as count
FROM client_profiles
WHERE user_id IS NOT NULL
UNION ALL
SELECT 'Freelancer Profile user_ids' as profile_type,
    MIN(LENGTH(user_id::text)) as min_length,
    MAX(LENGTH(user_id::text)) as max_length,
    COUNT(*) as count
FROM freelancer_profiles
WHERE user_id IS NOT NULL;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT 'SCHEMA ANALYSIS COMPLETE' as final_status;
SELECT 'Please copy the entire output above and share it for precise schema design' as instruction;




