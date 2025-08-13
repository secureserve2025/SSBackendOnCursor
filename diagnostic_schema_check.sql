-- Diagnostic Schema Check - Handle Type Mismatches
-- This will tell us exactly what data types we're dealing with

-- =============================================================================
-- SECTION 1: ALL TABLES
-- =============================================================================
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================  
-- SECTION 2: COLUMN DETAILS FOR KEY TABLES
-- =============================================================================
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('client_profiles', 'freelancer_profiles', 'projects')
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 3: EXISTING CONSTRAINTS 
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
AND tc.table_name IN ('client_profiles', 'freelancer_profiles', 'projects')
ORDER BY tc.table_name, tc.constraint_type;

-- =============================================================================
-- SECTION 4: CURRENT FOREIGN KEYS (if any)
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
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =============================================================================
-- SECTION 5: TABLE ROW COUNTS
-- =============================================================================
SELECT COUNT(*) as total_client_profiles FROM client_profiles;
SELECT COUNT(*) as total_freelancer_profiles FROM freelancer_profiles;  
SELECT COUNT(*) as total_projects FROM projects;

-- =============================================================================
-- SECTION 6: SAMPLE DATA - CLIENT_PROFILES
-- =============================================================================
SELECT 
    id, user_id, client_id, email, full_name, created_at
FROM client_profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- =============================================================================
-- SECTION 7: SAMPLE DATA - FREELANCER_PROFILES  
-- =============================================================================
SELECT 
    id, user_id, freelancer_id, email, full_name, created_at
FROM freelancer_profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- =============================================================================
-- SECTION 8: SAMPLE DATA - PROJECTS
-- =============================================================================
SELECT 
    id, project_id, client_id, freelancer_id, project_name, project_status, created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 3;

-- =============================================================================
-- SECTION 9: ID PATTERNS - CLIENT_PROFILES
-- =============================================================================
SELECT 
    MIN(LENGTH(client_id)) as min_length,
    MAX(LENGTH(client_id)) as max_length,
    COUNT(DISTINCT client_id) as unique_count,
    COUNT(*) as total_count
FROM client_profiles
WHERE client_id IS NOT NULL;

SELECT client_id as sample_client_id
FROM client_profiles 
WHERE client_id IS NOT NULL 
LIMIT 5;

-- =============================================================================
-- SECTION 10: ID PATTERNS - FREELANCER_PROFILES
-- =============================================================================
SELECT 
    MIN(LENGTH(freelancer_id)) as min_length,
    MAX(LENGTH(freelancer_id)) as max_length,
    COUNT(DISTINCT freelancer_id) as unique_count,
    COUNT(*) as total_count
FROM freelancer_profiles
WHERE freelancer_id IS NOT NULL;

SELECT freelancer_id as sample_freelancer_id
FROM freelancer_profiles 
WHERE freelancer_id IS NOT NULL 
LIMIT 5;

-- =============================================================================
-- SECTION 11: ID PATTERNS - PROJECTS TABLE
-- =============================================================================
SELECT 
    COUNT(DISTINCT client_id) as unique_client_ids_in_projects,
    COUNT(DISTINCT freelancer_id) as unique_freelancer_ids_in_projects,
    COUNT(*) as total_projects
FROM projects;

SELECT client_id as sample_project_client_id
FROM projects 
WHERE client_id IS NOT NULL 
LIMIT 5;

SELECT freelancer_id as sample_project_freelancer_id
FROM projects 
WHERE freelancer_id IS NOT NULL 
LIMIT 5;

-- =============================================================================
-- SECTION 12: DATA INTEGRITY CHECK - SAFE VERSION
-- =============================================================================

-- Check if any projects have client_id that doesn't match client_profiles.client_id
-- Using explicit casting to handle type differences
SELECT 
    p.id as project_id,
    p.project_id as project_code,
    p.client_id as client_id_in_projects,
    p.project_name
FROM projects p
WHERE p.client_id IS NOT NULL
  AND p.client_id::text NOT IN (
    SELECT client_id 
    FROM client_profiles 
    WHERE client_id IS NOT NULL
  )
  AND p.client_id::text NOT IN (
    SELECT user_id::text 
    FROM client_profiles 
    WHERE user_id IS NOT NULL
  )
LIMIT 5;

-- Check if any projects have freelancer_id that doesn't match freelancer_profiles.freelancer_id  
SELECT 
    p.id as project_id,
    p.project_id as project_code,
    p.freelancer_id as freelancer_id_in_projects,
    p.project_name
FROM projects p
WHERE p.freelancer_id IS NOT NULL
  AND p.freelancer_id NOT IN (
    SELECT freelancer_id 
    FROM freelancer_profiles 
    WHERE freelancer_id IS NOT NULL
  )
  AND p.freelancer_id NOT IN (
    SELECT user_id::text 
    FROM freelancer_profiles 
    WHERE user_id IS NOT NULL
  )
LIMIT 5;




