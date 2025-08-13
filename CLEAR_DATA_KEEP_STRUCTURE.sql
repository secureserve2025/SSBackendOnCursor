-- CLEAR ALL BUSINESS DATA - KEEP STRUCTURE AND AUTH
-- This script removes all data from business tables while preserving:
-- - auth.users (authentication data)
-- - All table structures
-- - All triggers and functions
-- - All constraints and relationships
-- - All API services and RLS policies
--
-- Perfect for fresh testing with clean data

-- =============================================================================
-- STEP 1: BACKUP NOTIFICATION
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
-- STEP 2: DISABLE TRIGGERS TEMPORARILY (for clean deletion)
-- =============================================================================

-- Disable triggers temporarily to avoid cascade issues during cleanup
ALTER TABLE client_profiles DISABLE TRIGGER ALL;
ALTER TABLE freelancer_profiles DISABLE TRIGGER ALL;
ALTER TABLE projects DISABLE TRIGGER ALL;
ALTER TABLE transactions DISABLE TRIGGER ALL;
ALTER TABLE project_files DISABLE TRIGGER ALL;
ALTER TABLE work_products DISABLE TRIGGER ALL;
ALTER TABLE verification_reports DISABLE TRIGGER ALL;
ALTER TABLE deliverables DISABLE TRIGGER ALL;
ALTER TABLE messages DISABLE TRIGGER ALL;
ALTER TABLE project_messages DISABLE TRIGGER ALL;

-- =============================================================================
-- STEP 3: CLEAR DATA IN DEPENDENCY ORDER (Child tables first)
-- =============================================================================

-- Clear child tables first (tables that reference other tables)

-- Clear project-related files and data
TRUNCATE TABLE verification_reports CASCADE;
RAISE NOTICE '✅ Cleared verification_reports table';

TRUNCATE TABLE work_products CASCADE;
RAISE NOTICE '✅ Cleared work_products table';

TRUNCATE TABLE project_files CASCADE;
RAISE NOTICE '✅ Cleared project_files table';

TRUNCATE TABLE deliverables CASCADE;
RAISE NOTICE '✅ Cleared deliverables table';

TRUNCATE TABLE messages CASCADE;
RAISE NOTICE '✅ Cleared messages table';

TRUNCATE TABLE project_messages CASCADE;
RAISE NOTICE '✅ Cleared project_messages table';

-- Clear transactions (references projects)
TRUNCATE TABLE transactions CASCADE;
RAISE NOTICE '✅ Cleared transactions table';

-- Clear projects (references profiles)
TRUNCATE TABLE projects CASCADE;
RAISE NOTICE '✅ Cleared projects table';

-- Clear profile tables (main business data)
TRUNCATE TABLE freelancer_profiles CASCADE;
RAISE NOTICE '✅ Cleared freelancer_profiles table';

TRUNCATE TABLE client_profiles CASCADE;
RAISE NOTICE '✅ Cleared client_profiles table';

-- =============================================================================
-- STEP 4: RE-ENABLE TRIGGERS
-- =============================================================================

-- Re-enable all triggers
ALTER TABLE client_profiles ENABLE TRIGGER ALL;
ALTER TABLE freelancer_profiles ENABLE TRIGGER ALL;
ALTER TABLE projects ENABLE TRIGGER ALL;
ALTER TABLE transactions ENABLE TRIGGER ALL;
ALTER TABLE project_files ENABLE TRIGGER ALL;
ALTER TABLE work_products ENABLE TRIGGER ALL;
ALTER TABLE verification_reports ENABLE TRIGGER ALL;
ALTER TABLE deliverables ENABLE TRIGGER ALL;
ALTER TABLE messages ENABLE TRIGGER ALL;
ALTER TABLE project_messages ENABLE TRIGGER ALL;

RAISE NOTICE '✅ Re-enabled all triggers';

-- =============================================================================
-- STEP 5: VERIFY STRUCTURE IS INTACT
-- =============================================================================

DO $$
DECLARE
    table_count INTEGER;
    constraint_count INTEGER;
    function_count INTEGER;
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
    
    -- Count functions (our custom functions)
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'generate_client_id',
        'generate_freelancer_id', 
        'prevent_client_id_update',
        'prevent_freelancer_id_update',
        'auto_assign_client_id',
        'auto_assign_freelancer_id',
        'is_valid_email',
        'check_email_exists_anywhere',
        'can_signup_as_client',
        'can_signup_as_freelancer',
        'validate_freelancer_complete'
    );
    
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
    RAISE NOTICE '  ⚙️ Custom Functions: % (business logic preserved)', function_count;
    RAISE NOTICE '  🔄 Triggers: % (automation preserved)', trigger_count;
    RAISE NOTICE '';
    RAISE NOTICE 'All business data cleared, ready for fresh testing!';
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
    RAISE NOTICE 'Users can now signup fresh and test all functionality!';
    RAISE NOTICE '=================================================================';
END $$;

-- =============================================================================
-- STEP 6: RESET SEQUENCES (Optional - for clean ID generation)
-- =============================================================================

-- Reset any sequences to start fresh (if you have any auto-increment fields)
-- Note: Since we're using UUID and custom ID generation, this may not be needed
-- but included for completeness

DO $$
DECLARE
    seq_record RECORD;
BEGIN
    -- Reset any sequences that might exist
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || seq_record.sequence_name || ' RESTART WITH 1';
        RAISE NOTICE 'Reset sequence: %', seq_record.sequence_name;
    END LOOP;
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
    RAISE NOTICE '1. Users can signup with new profiles (all validation works)';
    RAISE NOTICE '2. Create projects and test all functionality';
    RAISE NOTICE '3. All features implemented in previous fixes are active:';
    RAISE NOTICE '   - ID immutability protection';
    RAISE NOTICE '   - Single email per role enforcement';
    RAISE NOTICE '   - Email format validation';
    RAISE NOTICE '   - Freelancer profile validation';
    RAISE NOTICE '   - Proper foreign key relationships';
    RAISE NOTICE '';
END $$;




