-- Get Complete Database Schema Information - FIXED VERSION
-- Run this script to get all table structures and relationships

-- =============================================================================
-- PART 1: ALL TABLES AND THEIR COLUMNS
-- =============================================================================

SELECT 'DATABASE TABLES AND COLUMNS' as section_header;

-- Get all tables in the public schema
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- PART 2: DETAILED COLUMN INFORMATION
-- =============================================================================

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
-- PART 3: CONSTRAINTS AND RELATIONSHIPS
-- =============================================================================

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

-- =============================================================================
-- PART 4: FOREIGN KEY RELATIONSHIPS
-- =============================================================================

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
-- PART 5: DATABASE INDEXES
-- =============================================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- PART 6: TABLE ROW COUNTS
-- =============================================================================

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
ORDER BY table_name;

-- =============================================================================
-- PART 7: SAMPLE DATA FROM KEY TABLES
-- =============================================================================

-- CLIENT_PROFILES SAMPLE
SELECT 
    'CLIENT_PROFILES_SAMPLE' as table_info,
    id::text as id_value, 
    user_id::text as user_id_value, 
    client_id, 
    email, 
    full_name,
    created_at::text as created_at_value
FROM client_profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- FREELANCER_PROFILES SAMPLE  
SELECT 
    'FREELANCER_PROFILES_SAMPLE' as table_info,
    id::text as id_value,
    user_id::text as user_id_value,
    freelancer_id,
    email,
    full_name,
    created_at::text as created_at_value
FROM freelancer_profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- PROJECTS SAMPLE
SELECT 
    'PROJECTS_SAMPLE' as table_info,
    id::text as id_value,
    project_id,
    client_id,
    freelancer_id,
    project_name,
    project_status
FROM projects 
ORDER BY created_at DESC 
LIMIT 3;

-- =============================================================================
-- PART 8: ID PATTERNS ANALYSIS
-- =============================================================================

SELECT 
    'CLIENT_ID_PATTERNS' as pattern_type,
    MIN(LENGTH(client_id))::text as min_length,
    MAX(LENGTH(client_id))::text as max_length,
    COUNT(DISTINCT client_id)::text as unique_count,
    COUNT(*)::text as total_count
FROM client_profiles
WHERE client_id IS NOT NULL
UNION ALL
SELECT 
    'FREELANCER_ID_PATTERNS' as pattern_type,
    MIN(LENGTH(freelancer_id))::text as min_length,
    MAX(LENGTH(freelancer_id))::text as max_length,
    COUNT(DISTINCT freelancer_id)::text as unique_count,
    COUNT(*)::text as total_count
FROM freelancer_profiles
WHERE freelancer_id IS NOT NULL
UNION ALL
SELECT 
    'PROJECT_CLIENT_ID_PATTERNS' as pattern_type,
    MIN(LENGTH(client_id))::text as min_length,
    MAX(LENGTH(client_id))::text as max_length,
    COUNT(DISTINCT client_id)::text as unique_count,
    COUNT(*)::text as total_count
FROM projects
WHERE client_id IS NOT NULL
UNION ALL
SELECT 
    'PROJECT_FREELANCER_ID_PATTERNS' as pattern_type,
    MIN(LENGTH(freelancer_id))::text as min_length,
    MAX(LENGTH(freelancer_id))::text as max_length,
    COUNT(DISTINCT freelancer_id)::text as unique_count,
    COUNT(*)::text as total_count
FROM projects
WHERE freelancer_id IS NOT NULL;

-- =============================================================================
-- PART 9: EXAMPLE ID FORMATS
-- =============================================================================

SELECT 
    'Client_IDs' as id_type, 
    client_id as example_id
FROM client_profiles 
WHERE client_id IS NOT NULL 
LIMIT 3
UNION ALL
SELECT 
    'Freelancer_IDs' as id_type, 
    freelancer_id as example_id
FROM freelancer_profiles 
WHERE freelancer_id IS NOT NULL 
LIMIT 3
UNION ALL
SELECT 
    'Project_Client_IDs' as id_type, 
    client_id as example_id
FROM projects 
WHERE client_id IS NOT NULL 
LIMIT 3
UNION ALL
SELECT 
    'Project_Freelancer_IDs' as id_type, 
    freelancer_id as example_id
FROM projects 
WHERE freelancer_id IS NOT NULL 
LIMIT 3;

-- =============================================================================
-- PART 10: DATA INTEGRITY ANALYSIS - ORPHANED PROJECTS
-- =============================================================================

-- Check for orphaned projects (client_id doesn't exist in client_profiles)
SELECT 
    'ORPHANED_CLIENT_REFS' as issue_type,
    p.id::text as project_id_value,
    p.project_id,
    p.client_id as missing_client_id,
    p.project_name
FROM projects p
WHERE p.client_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM client_profiles c 
    WHERE c.client_id = p.client_id 
       OR c.user_id::text = p.client_id
  )
LIMIT 5;

-- Check for orphaned projects (freelancer_id doesn't exist in freelancer_profiles)  
SELECT 
    'ORPHANED_FREELANCER_REFS' as issue_type,
    p.id::text as project_id_value,
    p.project_id,
    p.freelancer_id as missing_freelancer_id,
    p.project_name
FROM projects p
WHERE p.freelancer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM freelancer_profiles f 
    WHERE f.freelancer_id = p.freelancer_id 
       OR f.user_id::text = p.freelancer_id
  )
LIMIT 5;

-- =============================================================================
-- PART 11: USER_ID PATTERNS  
-- =============================================================================

SELECT 
    'Client_Profile_user_ids' as profile_type,
    MIN(LENGTH(user_id::text))::text as min_length,
    MAX(LENGTH(user_id::text))::text as max_length,
    COUNT(*)::text as count
FROM client_profiles
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'Freelancer_Profile_user_ids' as profile_type,
    MIN(LENGTH(user_id::text))::text as min_length,
    MAX(LENGTH(user_id::text))::text as max_length,
    COUNT(*)::text as count
FROM freelancer_profiles
WHERE user_id IS NOT NULL;




