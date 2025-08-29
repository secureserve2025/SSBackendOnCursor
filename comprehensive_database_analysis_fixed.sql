-- =============================================================================
-- COMPREHENSIVE DATABASE STRUCTURE ANALYSIS (FIXED)
-- =============================================================================
-- This script provides a complete analysis of all tables and their structure
-- in your Supabase database with correct PostgreSQL column names
-- =============================================================================

-- =============================================================================
-- PART 1: ALL TABLES IN THE DATABASE
-- =============================================================================

SELECT 'ALL TABLES IN DATABASE' as section_header;
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- =============================================================================
-- PART 2: DETAILED COLUMN ANALYSIS FOR ALL TABLES
-- =============================================================================

SELECT 'DETAILED COLUMN ANALYSIS' as section_header;

SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.udt_name
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema IN ('public', 'auth')
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- =============================================================================
-- PART 3: FOREIGN KEY RELATIONSHIPS
-- =============================================================================

SELECT 'FOREIGN KEY RELATIONSHIPS' as section_header;

SELECT 
    tc.table_schema,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_schema as to_schema,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema IN ('public', 'auth')
ORDER BY tc.table_schema, tc.table_name, kcu.column_name;

-- =============================================================================
-- PART 4: PRIMARY KEYS
-- =============================================================================

SELECT 'PRIMARY KEYS' as section_header;

SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name as primary_key_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema IN ('public', 'auth')
ORDER BY tc.table_schema, tc.table_name;

-- =============================================================================
-- PART 5: UNIQUE CONSTRAINTS
-- =============================================================================

SELECT 'UNIQUE CONSTRAINTS' as section_header;

SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name as unique_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema IN ('public', 'auth')
ORDER BY tc.table_schema, tc.table_name, kcu.column_name;

-- =============================================================================
-- PART 6: ROW LEVEL SECURITY (RLS) STATUS
-- =============================================================================

SELECT 'ROW LEVEL SECURITY STATUS' as section_header;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- =============================================================================
-- PART 7: RLS POLICIES
-- =============================================================================

SELECT 'RLS POLICIES' as section_header;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as policy_command,
    permissive,
    roles,
    qual as policy_condition,
    with_check as policy_check
FROM pg_policies 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename, policyname;

-- =============================================================================
-- PART 8: TRIGGERS
-- =============================================================================

SELECT 'TRIGGERS' as section_header;

SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY trigger_schema, event_object_table, trigger_name;

-- =============================================================================
-- PART 9: FUNCTIONS
-- =============================================================================

SELECT 'FUNCTIONS' as section_header;

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;

-- =============================================================================
-- PART 10: INDEXES
-- =============================================================================

SELECT 'INDEXES' as section_header;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename, indexname;

-- =============================================================================
-- PART 11: SAMPLE DATA ANALYSIS
-- =============================================================================

SELECT 'SAMPLE DATA ANALYSIS' as section_header;

-- Count records in each table
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- =============================================================================
-- PART 12: SUMMARY
-- =============================================================================

SELECT 'DATABASE ANALYSIS SUMMARY' as section_header;

SELECT 
    'Total Tables' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Public Tables' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Auth Tables' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'auth'
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Columns' as metric,
    COUNT(*) as count
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema IN ('public', 'auth')
AND t.table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Foreign Keys' as metric,
    COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema IN ('public', 'auth')
UNION ALL
SELECT 
    'RLS Enabled Tables' as metric,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
AND rowsecurity = true;

-- =============================================================================
-- FINAL MESSAGE
-- =============================================================================

SELECT 'COMPREHENSIVE DATABASE ANALYSIS COMPLETED' as final_status;
SELECT 'Copy the entire output above to understand your complete database structure.' as instruction;



