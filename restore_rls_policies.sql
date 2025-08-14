-- =============================================================================
-- RLS POLICIES RESTORE SCRIPT
-- This script restores RLS policies from the backup created by disable_rls_policies_safe.sql
-- =============================================================================

-- WARNING: This will re-enable all data access restrictions
-- Make sure you want to restore security before running this

-- =============================================================================
-- STEP 1: VERIFY BACKUP EXISTS
-- =============================================================================

DO $$
BEGIN
    -- Check if backup tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rls_policies_backup') THEN
        RAISE EXCEPTION 'Backup table rls_policies_backup not found. Cannot restore RLS policies.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rls_enabled_tables_backup') THEN
        RAISE EXCEPTION 'Backup table rls_enabled_tables_backup not found. Cannot restore RLS policies.';
    END IF;
    
    RAISE NOTICE 'Backup tables found. Proceeding with restore...';
END $$;

-- =============================================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Enable RLS on all application tables
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables (if they exist)
DO $$
BEGIN
    -- Check and enable RLS on deliverables table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') THEN
        ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on deliverables table';
    END IF;
    
    -- Check and enable RLS on work_products table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products') THEN
        ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on work_products table';
    END IF;
    
    -- Check and enable RLS on verification_reports table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_reports') THEN
        ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on verification_reports table';
    END IF;
    
    -- Check and enable RLS on project_files table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') THEN
        ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on project_files table';
    END IF;
    
    -- Check and enable RLS on project_status_history table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_status_history') THEN
        ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on project_status_history table';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: RESTORE RLS POLICIES FROM BACKUP
-- =============================================================================

DO $$
DECLARE
    policy_record RECORD;
    policy_data JSONB;
    policy_sql TEXT;
    restored_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting RLS policies restore...';
    
    -- Restore policies from backup
    FOR policy_record IN 
        SELECT 
            table_name,
            policy_name,
            policy_definition,
            policy_type
        FROM rls_policies_backup
        ORDER BY table_name, policy_name
    LOOP
        BEGIN
            -- Parse the policy definition
            policy_data := policy_record.policy_definition::jsonb;
            
            -- Build the CREATE POLICY statement
            IF policy_record.table_name = 'storage.objects' THEN
                -- Handle storage policies
                policy_sql := 'CREATE POLICY "' || policy_record.policy_name || '" ON storage.objects';
            ELSE
                -- Handle regular table policies
                policy_sql := 'CREATE POLICY "' || policy_record.policy_name || '" ON ' || policy_record.table_name;
            END IF;
            
            -- Add the command type
            policy_sql := policy_sql || ' FOR ' || policy_record.policy_type;
            
            -- Add the USING clause if it exists
            IF policy_data->>'qual' IS NOT NULL AND policy_data->>'qual' != '' THEN
                policy_sql := policy_sql || ' USING ' || (policy_data->>'qual');
            END IF;
            
            -- Add the WITH CHECK clause if it exists
            IF policy_data->>'with_check' IS NOT NULL AND policy_data->>'with_check' != '' THEN
                policy_sql := policy_sql || ' WITH CHECK ' || (policy_data->>'with_check');
            END IF;
            
            -- Execute the policy creation
            EXECUTE policy_sql;
            restored_count := restored_count + 1;
            RAISE NOTICE 'Restored policy: % on %', policy_record.policy_name, policy_record.table_name;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to restore policy % on %: %', policy_record.policy_name, policy_record.table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Restored % policies successfully', restored_count;
END $$;

-- =============================================================================
-- STEP 4: VERIFICATION
-- =============================================================================

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
    'messages', 'deliverables', 'work_products', 'verification_reports', 
    'project_files', 'project_status_history'
)
ORDER BY tablename;

-- Verify policies are restored
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
    'messages', 'deliverables', 'work_products', 'verification_reports', 
    'project_files', 'project_status_history'
)
ORDER BY tablename, policyname;

-- Show restore summary
SELECT 
    'Restore Summary' as info,
    COUNT(*) as total_policies_restored
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
    'messages', 'deliverables', 'work_products', 'verification_reports', 
    'project_files', 'project_status_history'
);

-- =============================================================================
-- STEP 5: CLEANUP (OPTIONAL)
-- =============================================================================

-- Ask user if they want to clean up backup tables
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES SUCCESSFULLY RESTORED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All RLS policies have been restored from backup.';
    RAISE NOTICE 'Security restrictions are now active again.';
    RAISE NOTICE '';
    RAISE NOTICE 'Backup tables are still available:';
    RAISE NOTICE '- rls_policies_backup';
    RAISE NOTICE '- rls_enabled_tables_backup';
    RAISE NOTICE '';
    RAISE NOTICE 'To clean up backup tables, run:';
    RAISE NOTICE 'DROP TABLE rls_policies_backup;';
    RAISE NOTICE 'DROP TABLE rls_enabled_tables_backup;';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- OPTIONAL: CLEANUP SCRIPT (UNCOMMENT TO USE)
-- =============================================================================

-- Uncomment the following lines if you want to automatically clean up backup tables
-- DROP TABLE IF EXISTS rls_policies_backup;
-- DROP TABLE IF EXISTS rls_enabled_tables_backup;
-- RAISE NOTICE 'Backup tables cleaned up successfully.';
