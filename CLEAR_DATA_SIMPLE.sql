-- CLEAR ALL BUSINESS DATA - SIMPLE VERSION
-- This script removes all data from business tables while preserving:
-- - auth.users (authentication data)
-- - All table structures
-- - All triggers and functions
-- - All constraints and relationships
-- - All API services and RLS policies

-- =============================================================================
-- STEP 1: NOTIFICATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'CLEARING ALL BUSINESS DATA - KEEPING STRUCTURE AND AUTH';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'This will delete all data from business tables but preserve:';
    RAISE NOTICE '  ✅ auth.users (authentication accounts)';
    RAISE NOTICE '  ✅ All table structures';
    RAISE NOTICE '  ✅ All triggers and functions';
    RAISE NOTICE '  ✅ All constraints and foreign keys';
    RAISE NOTICE '  ✅ All RLS policies';
    RAISE NOTICE '  ✅ All API services';
    RAISE NOTICE '';
    RAISE NOTICE 'Starting data cleanup...';
END $$;

-- =============================================================================
-- STEP 2: CLEAR DATA IN DEPENDENCY ORDER (Child tables first)
-- =============================================================================

-- Method: Use DELETE instead of TRUNCATE to respect foreign key constraints
-- This is safer and doesn't require disabling system triggers

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clear child tables first (tables that reference other tables)
    
    -- Clear project-related files and data
    DELETE FROM verification_reports;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from verification_reports table', deleted_count;
    
    DELETE FROM work_products;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from work_products table', deleted_count;
    
    DELETE FROM project_files;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from project_files table', deleted_count;
    
    DELETE FROM deliverables;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from deliverables table', deleted_count;
    
    DELETE FROM messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from messages table', deleted_count;
    
    DELETE FROM project_messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from project_messages table', deleted_count;
    
    -- Clear transactions (references projects)
    DELETE FROM transactions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from transactions table', deleted_count;
    
    -- Clear projects (references profiles)
    DELETE FROM projects;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from projects table', deleted_count;
    
    -- Clear profile tables (main business data)
    DELETE FROM freelancer_profiles;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from freelancer_profiles table', deleted_count;
    
    DELETE FROM client_profiles;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleared % rows from client_profiles table', deleted_count;
END $$;

-- =============================================================================
-- STEP 3: VERIFY DATA IS CLEARED
-- =============================================================================

DO $$
DECLARE
    total_records INTEGER := 0;
    table_record RECORD;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Verifying data cleanup:';
    
    -- Check each table
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN (
            'client_profiles', 'freelancer_profiles', 'projects', 
            'transactions', 'messages', 'project_messages',
            'deliverables', 'project_files', 'work_products', 
            'verification_reports'
        )
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || table_record.table_name INTO table_count;
        total_records := total_records + table_count;
        RAISE NOTICE '  📊 %: % rows remaining', table_record.table_name, table_count;
    END LOOP;
    
    IF total_records = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ SUCCESS: All business data cleared!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  WARNING: % rows still remain in business tables', total_records;
    END IF;
END $$;

-- =============================================================================
-- STEP 4: VERIFY STRUCTURE IS INTACT
-- =============================================================================

DO $$
DECLARE
    table_count INTEGER;
    constraint_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Count constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'DATA CLEANUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Database Structure Verification:';
    RAISE NOTICE '  📊 Tables: % (structure preserved)', table_count;
    RAISE NOTICE '  🔗 Constraints: % (relationships preserved)', constraint_count;
    RAISE NOTICE '  🔄 Triggers: % (automation preserved)', trigger_count;
    RAISE NOTICE '';
    RAISE NOTICE 'What is preserved:';
    RAISE NOTICE '  ✅ auth.users (all user accounts can still login)';
    RAISE NOTICE '  ✅ All table structures and columns';
    RAISE NOTICE '  ✅ All foreign key relationships';
    RAISE NOTICE '  ✅ All triggers (ID generation, immutability)';
    RAISE NOTICE '  ✅ All functions (validation, authentication)';
    RAISE NOTICE '  ✅ All RLS policies';
    RAISE NOTICE '  ✅ All API endpoints and services';
    RAISE NOTICE '';
    RAISE NOTICE 'What was cleared:';
    RAISE NOTICE '  🗑️ All client profiles';
    RAISE NOTICE '  🗑️ All freelancer profiles';
    RAISE NOTICE '  🗑️ All projects and related data';
    RAISE NOTICE '  🗑️ All transactions';
    RAISE NOTICE '  🗑️ All files and deliverables';
    RAISE NOTICE '  🗑️ All messages';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run COMPREHENSIVE_DATABASE_FIX.sql to implement all features!';
    RAISE NOTICE '=================================================================';
END $$;

-- =============================================================================
-- FINAL STATUS
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 DATABASE READY FOR FRESH TESTING!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run COMPREHENSIVE_DATABASE_FIX.sql to add all features';
    RAISE NOTICE '2. Users can signup with new profiles';
    RAISE NOTICE '3. Create projects and test all functionality';
    RAISE NOTICE '';
    RAISE NOTICE 'Features to be implemented in next script:';
    RAISE NOTICE '   - ID immutability protection';
    RAISE NOTICE '   - Single email per role enforcement';
    RAISE NOTICE '   - Email format validation';
    RAISE NOTICE '   - Freelancer profile validation';
    RAISE NOTICE '   - Proper foreign key relationships';
    RAISE NOTICE '';
    RAISE NOTICE 'DATA CLEANUP COMPLETE!';
END $$;




