-- Simple Database Schema Analysis - No UNION statements
-- Run each section separately if needed

-- =============================================================================
-- SECTION 1: ALL TABLES
-- =============================================================================
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- SECTION 2: ALL COLUMNS WITH DETAILS
-- =============================================================================
SELECT 
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 3: ALL CONSTRAINTS
-- =============================================================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- =============================================================================
-- SECTION 4: FOREIGN KEY RELATIONSHIPS
-- =============================================================================
SELECT 
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- =============================================================================
-- SECTION 5: CLIENT_PROFILES TABLE DATA
-- =============================================================================
SELECT COUNT(*) as total_client_profiles FROM client_profiles;

SELECT 
    id, user_id, client_id, email, full_name, created_at
FROM client_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- =============================================================================
-- SECTION 6: FREELANCER_PROFILES TABLE DATA
-- =============================================================================
SELECT COUNT(*) as total_freelancer_profiles FROM freelancer_profiles;

SELECT 
    id, user_id, freelancer_id, email, full_name, created_at
FROM freelancer_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- =============================================================================
-- SECTION 7: PROJECTS TABLE DATA
-- =============================================================================
SELECT COUNT(*) as total_projects FROM projects;

SELECT 
    id, project_id, client_id, freelancer_id, project_name, project_status, created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- =============================================================================
-- SECTION 8: DATA INTEGRITY CHECK - ORPHANED CLIENT REFERENCES
-- =============================================================================
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
LIMIT 10;

-- =============================================================================
-- SECTION 9: DATA INTEGRITY CHECK - ORPHANED FREELANCER REFERENCES  
-- =============================================================================
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
LIMIT 10;

-- =============================================================================
-- SECTION 10: ID PATTERNS
-- =============================================================================
SELECT 'CLIENT_ID_ANALYSIS' as analysis_type;
SELECT 
    MIN(LENGTH(client_id)) as min_length,
    MAX(LENGTH(client_id)) as max_length,
    COUNT(DISTINCT client_id) as unique_count,
    COUNT(*) as total_count
FROM client_profiles
WHERE client_id IS NOT NULL;

SELECT 'FREELANCER_ID_ANALYSIS' as analysis_type;
SELECT 
    MIN(LENGTH(freelancer_id)) as min_length,
    MAX(LENGTH(freelancer_id)) as max_length,
    COUNT(DISTINCT freelancer_id) as unique_count,
    COUNT(*) as total_count
FROM freelancer_profiles
WHERE freelancer_id IS NOT NULL;

-- =============================================================================
-- SECTION 11: SAMPLE IDS
-- =============================================================================
SELECT 'Sample Client IDs' as sample_type, client_id as sample_id
FROM client_profiles 
WHERE client_id IS NOT NULL 
LIMIT 5;

SELECT 'Sample Freelancer IDs' as sample_type, freelancer_id as sample_id
FROM freelancer_profiles 
WHERE freelancer_id IS NOT NULL 
LIMIT 5;

SELECT 'Sample Project Client IDs' as sample_type, client_id as sample_id
FROM projects 
WHERE client_id IS NOT NULL 
LIMIT 5;

SELECT 'Sample Project Freelancer IDs' as sample_type, freelancer_id as sample_id
FROM projects 
WHERE freelancer_id IS NOT NULL 
LIMIT 5;
