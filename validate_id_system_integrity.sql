-- Comprehensive Validation Script for Client ID and Freelancer ID System
-- This script checks the integrity of the entire ID system and identifies any issues

-- =============================================================================
-- STEP 1: Check current database state
-- =============================================================================

-- Check if tables exist
SELECT 
    'Table Existence Check' as check_type,
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (VALUES 
    ('client_profiles'),
    ('freelancer_profiles'),
    ('projects'),
    ('project_files'),
    ('deliverables'),
    ('work_products'),
    ('transactions'),
    ('messages')
) AS t(table_name);

-- =============================================================================
-- STEP 2: Validate ID format consistency
-- =============================================================================

-- Check client_id format (should be C + 9 digits)
SELECT 
    'Client ID Format Validation' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN client_id ~ '^C[0-9]{9}$' THEN 1 END) as valid_format,
    COUNT(CASE WHEN client_id !~ '^C[0-9]{9}$' THEN 1 END) as invalid_format,
    ARRAY_AGG(client_id) FILTER (WHERE client_id !~ '^C[0-9]{9}$') as invalid_ids
FROM client_profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles');

-- Check freelancer_id format (should be F + 9 digits)
SELECT 
    'Freelancer ID Format Validation' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN freelancer_id ~ '^F[0-9]{9}$' THEN 1 END) as valid_format,
    COUNT(CASE WHEN freelancer_id !~ '^F[0-9]{9}$' THEN 1 END) as invalid_format,
    ARRAY_AGG(freelancer_id) FILTER (WHERE freelancer_id !~ '^F[0-9]{9}$') as invalid_ids
FROM freelancer_profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles');

-- =============================================================================
-- STEP 3: Check for duplicate IDs
-- =============================================================================

-- Check for duplicate client_ids
SELECT 
    'Client ID Uniqueness Check' as check_type,
    client_id,
    COUNT(*) as occurrence_count
FROM client_profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles')
GROUP BY client_id
HAVING COUNT(*) > 1;

-- Check for duplicate freelancer_ids
SELECT 
    'Freelancer ID Uniqueness Check' as check_type,
    freelancer_id,
    COUNT(*) as occurrence_count
FROM freelancer_profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles')
GROUP BY freelancer_id
HAVING COUNT(*) > 1;

-- =============================================================================
-- STEP 4: Check email consistency for dual roles
-- =============================================================================

-- Find users who have both client and freelancer profiles
SELECT 
    'Dual Role Users Check' as check_type,
    cp.email,
    cp.client_id,
    cp.full_name as client_name,
    fp.freelancer_id,
    fp.full_name as freelancer_name,
    cp.created_at as client_created,
    fp.created_at as freelancer_created
FROM client_profiles cp
INNER JOIN freelancer_profiles fp ON cp.email = fp.email
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles')
ORDER BY cp.email;

-- =============================================================================
-- STEP 5: Validate foreign key relationships
-- =============================================================================

-- Check projects table foreign key consistency (if exists)
SELECT 
    'Projects Foreign Key Validation' as check_type,
    COUNT(*) as total_projects,
    COUNT(CASE WHEN cp.client_id IS NOT NULL THEN 1 END) as valid_client_refs,
    COUNT(CASE WHEN cp.client_id IS NULL THEN 1 END) as invalid_client_refs,
    COUNT(CASE WHEN fp.freelancer_id IS NOT NULL OR p.freelancer_id IS NULL THEN 1 END) as valid_freelancer_refs,
    COUNT(CASE WHEN fp.freelancer_id IS NULL AND p.freelancer_id IS NOT NULL THEN 1 END) as invalid_freelancer_refs
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.client_id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects');

-- List projects with invalid references
SELECT 
    'Invalid Project References' as check_type,
    p.project_id,
    p.client_id,
    p.freelancer_id,
    CASE WHEN cp.client_id IS NULL THEN 'INVALID CLIENT_ID' ELSE 'Valid Client' END as client_status,
    CASE WHEN fp.freelancer_id IS NULL AND p.freelancer_id IS NOT NULL THEN 'INVALID FREELANCER_ID' 
         WHEN p.freelancer_id IS NULL THEN 'No Freelancer Assigned'
         ELSE 'Valid Freelancer' END as freelancer_status
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.client_id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
  AND (cp.client_id IS NULL OR (fp.freelancer_id IS NULL AND p.freelancer_id IS NOT NULL));

-- =============================================================================
-- STEP 6: Check trigger and function existence
-- =============================================================================

-- Check if immutability triggers exist
SELECT 
    'Immutability Triggers Check' as check_type,
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'prevent_client_id_modification',
    'prevent_freelancer_id_modification'
)
ORDER BY event_object_table;

-- Check if ID generation functions exist
SELECT 
    'ID Generation Functions Check' as check_type,
    routine_name,
    routine_type,
    CASE WHEN routine_definition IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.routines 
WHERE routine_name IN (
    'generate_client_id',
    'generate_freelancer_id',
    'prevent_client_id_update',
    'prevent_freelancer_id_update',
    'handle_new_client',
    'handle_new_freelancer'
)
ORDER BY routine_name;

-- =============================================================================
-- STEP 7: Check constraints
-- =============================================================================

-- Check if format constraints exist
SELECT 
    'ID Format Constraints Check' as check_type,
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_name IN (
    'check_client_id_format',
    'check_freelancer_id_format'
)
ORDER BY table_name;

-- =============================================================================
-- STEP 8: Performance and indexing check
-- =============================================================================

-- Check if proper indexes exist
SELECT 
    'Index Check' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_client_profiles_client_id',
    'idx_freelancer_profiles_freelancer_id',
    'idx_projects_client_id',
    'idx_projects_freelancer_id'
  )
ORDER BY tablename, indexname;

-- =============================================================================
-- STEP 9: Audit trail check
-- =============================================================================

-- Check if audit log table exists and has recent entries
SELECT 
    'Audit Log Check' as check_type,
    COUNT(*) as total_log_entries,
    COUNT(CASE WHEN action = 'INSERT' THEN 1 END) as insert_logs,
    COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as update_logs,
    COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as delete_logs,
    MAX(created_at) as latest_log_entry
FROM profile_audit_log
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_audit_log');

-- =============================================================================
-- STEP 10: Test ID generation (if functions exist)
-- =============================================================================

-- Test client ID generation
DO $$
DECLARE
    test_client_id VARCHAR(20);
    func_exists BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'generate_client_id'
    ) INTO func_exists;
    
    IF func_exists THEN
        SELECT generate_client_id() INTO test_client_id;
        RAISE NOTICE 'Test Client ID Generation: %', test_client_id;
        
        -- Validate format
        IF test_client_id ~ '^C[0-9]{9}$' THEN
            RAISE NOTICE 'Client ID format is valid';
        ELSE
            RAISE WARNING 'Client ID format is invalid: %', test_client_id;
        END IF;
    ELSE
        RAISE WARNING 'generate_client_id function does not exist';
    END IF;
END $$;

-- Test freelancer ID generation
DO $$
DECLARE
    test_freelancer_id VARCHAR(20);
    func_exists BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'generate_freelancer_id'
    ) INTO func_exists;
    
    IF func_exists THEN
        SELECT generate_freelancer_id() INTO test_freelancer_id;
        RAISE NOTICE 'Test Freelancer ID Generation: %', test_freelancer_id;
        
        -- Validate format
        IF test_freelancer_id ~ '^F[0-9]{9}$' THEN
            RAISE NOTICE 'Freelancer ID format is valid';
        ELSE
            RAISE WARNING 'Freelancer ID format is invalid: %', test_freelancer_id;
        END IF;
    ELSE
        RAISE WARNING 'generate_freelancer_id function does not exist';
    END IF;
END $$;

-- =============================================================================
-- STEP 11: Summary report
-- =============================================================================

-- Generate overall system health summary
SELECT 
    'SYSTEM HEALTH SUMMARY' as report_type,
    'Total Users' as metric,
    (
        COALESCE((SELECT COUNT(*) FROM client_profiles), 0) +
        COALESCE((SELECT COUNT(*) FROM freelancer_profiles), 0) -
        COALESCE((
            SELECT COUNT(*) FROM client_profiles cp 
            INNER JOIN freelancer_profiles fp ON cp.email = fp.email
        ), 0)
    ) as value,
    'Unique users across both profiles' as description

UNION ALL

SELECT 
    'SYSTEM HEALTH SUMMARY',
    'Client Profiles',
    COALESCE((SELECT COUNT(*) FROM client_profiles), 0),
    'Total client profiles'

UNION ALL

SELECT 
    'SYSTEM HEALTH SUMMARY',
    'Freelancer Profiles',
    COALESCE((SELECT COUNT(*) FROM freelancer_profiles), 0),
    'Total freelancer profiles'

UNION ALL

SELECT 
    'SYSTEM HEALTH SUMMARY',
    'Dual Role Users',
    COALESCE((
        SELECT COUNT(*) FROM client_profiles cp 
        INNER JOIN freelancer_profiles fp ON cp.email = fp.email
        WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles')
          AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles')
    ), 0),
    'Users with both client and freelancer profiles'

UNION ALL

SELECT 
    'SYSTEM HEALTH SUMMARY',
    'Total Projects',
    COALESCE((SELECT COUNT(*) FROM projects), 0),
    'Total projects in system'

ORDER BY report_type, metric;

-- =============================================================================
-- STEP 12: Recommendations
-- =============================================================================

-- Generate recommendations based on findings
DO $$
DECLARE
    client_count INTEGER;
    freelancer_count INTEGER;
    dual_role_count INTEGER;
    invalid_client_ids INTEGER;
    invalid_freelancer_ids INTEGER;
    missing_triggers INTEGER;
    missing_functions INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO client_count FROM client_profiles 
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles');
    
    SELECT COUNT(*) INTO freelancer_count FROM freelancer_profiles 
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles');
    
    SELECT COUNT(*) INTO dual_role_count FROM client_profiles cp 
    INNER JOIN freelancer_profiles fp ON cp.email = fp.email
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles');
    
    SELECT COUNT(*) INTO invalid_client_ids FROM client_profiles 
    WHERE client_id !~ '^C[0-9]{9}$'
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles');
    
    SELECT COUNT(*) INTO invalid_freelancer_ids FROM freelancer_profiles 
    WHERE freelancer_id !~ '^F[0-9]{9}$'
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles');
    
    SELECT COUNT(*) INTO missing_triggers 
    FROM (VALUES ('prevent_client_id_modification'), ('prevent_freelancer_id_modification')) AS expected(trigger_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = expected.trigger_name
    );
    
    SELECT COUNT(*) INTO missing_functions 
    FROM (VALUES 
        ('generate_client_id'), ('generate_freelancer_id'),
        ('prevent_client_id_update'), ('prevent_freelancer_id_update')
    ) AS expected(function_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = expected.function_name
    );
    
    -- Generate recommendations
    RAISE NOTICE '=== SYSTEM ANALYSIS COMPLETE ===';
    RAISE NOTICE 'Client Profiles: %', client_count;
    RAISE NOTICE 'Freelancer Profiles: %', freelancer_count;
    RAISE NOTICE 'Dual Role Users: %', dual_role_count;
    
    IF invalid_client_ids > 0 THEN
        RAISE WARNING 'Found % invalid client IDs that need to be fixed', invalid_client_ids;
    END IF;
    
    IF invalid_freelancer_ids > 0 THEN
        RAISE WARNING 'Found % invalid freelancer IDs that need to be fixed', invalid_freelancer_ids;
    END IF;
    
    IF missing_triggers > 0 THEN
        RAISE WARNING 'Missing % immutability triggers - run fix_client_freelancer_id_immutability.sql', missing_triggers;
    END IF;
    
    IF missing_functions > 0 THEN
        RAISE WARNING 'Missing % essential functions - run fix_client_freelancer_id_immutability.sql', missing_functions;
    END IF;
    
    IF dual_role_count > 0 THEN
        RAISE NOTICE 'System correctly allows % users to have both client and freelancer profiles', dual_role_count;
    END IF;
    
    RAISE NOTICE '=== END ANALYSIS ===';
END $$;




