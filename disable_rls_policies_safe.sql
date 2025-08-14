-- =============================================================================
-- SAFE RLS POLICIES DISABLE SCRIPT
-- This script safely disables RLS policies for development/testing
-- Includes backup and restore functionality
-- =============================================================================

-- WARNING: This will temporarily remove all data access restrictions
-- Only run this in development/testing environments
-- Never run in production!

-- =============================================================================
-- STEP 1: CREATE BACKUP TABLES FOR EXISTING RLS POLICIES
-- =============================================================================

-- Create backup table for RLS policy information
CREATE TABLE IF NOT EXISTS rls_policies_backup (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_definition TEXT,
    policy_type VARCHAR(50), -- SELECT, INSERT, UPDATE, DELETE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    backup_notes TEXT
);

-- Create backup table for RLS enabled tables
CREATE TABLE IF NOT EXISTS rls_enabled_tables_backup (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    schema_name VARCHAR(255) NOT NULL,
    was_rls_enabled BOOLEAN DEFAULT TRUE,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: BACKUP CURRENT RLS POLICIES
-- =============================================================================

DO $$
DECLARE
    policy_record RECORD;
    table_record RECORD;
BEGIN
    -- Log the backup process
    RAISE NOTICE 'Starting RLS policies backup...';
    
    -- Backup RLS enabled tables
    INSERT INTO rls_enabled_tables_backup (table_name, schema_name, was_rls_enabled)
    SELECT 
        tablename,
        schemaname,
        TRUE
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
        'messages', 'deliverables', 'work_products', 'verification_reports', 
        'project_files', 'project_status_history'
    );
    
    RAISE NOTICE 'Backed up % RLS enabled tables', (SELECT COUNT(*) FROM rls_enabled_tables_backup);
    
    -- Backup existing policies
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN (
            'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
            'messages', 'deliverables', 'work_products', 'verification_reports', 
            'project_files', 'project_status_history'
        )
    LOOP
        INSERT INTO rls_policies_backup (
            table_name, 
            policy_name, 
            policy_definition,
            policy_type
        ) VALUES (
            policy_record.tablename,
            policy_record.policyname,
            json_build_object(
                'schema', policy_record.schemaname,
                'table', policy_record.tablename,
                'policy_name', policy_record.policyname,
                'permissive', policy_record.permissive,
                'roles', policy_record.roles,
                'cmd', policy_record.cmd,
                'qual', policy_record.qual,
                'with_check', policy_record.with_check
            )::text,
            policy_record.cmd
        );
    END LOOP;
    
    RAISE NOTICE 'Backed up % RLS policies', (SELECT COUNT(*) FROM rls_policies_backup);
    
    -- Also backup storage policies
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%work%' OR policyname LIKE '%project%'
    LOOP
        INSERT INTO rls_policies_backup (
            table_name, 
            policy_name, 
            policy_definition,
            policy_type
        ) VALUES (
            'storage.objects',
            policy_record.policyname,
            json_build_object(
                'schema', policy_record.schemaname,
                'table', policy_record.tablename,
                'policy_name', policy_record.policyname,
                'permissive', policy_record.permissive,
                'roles', policy_record.roles,
                'cmd', policy_record.cmd,
                'qual', policy_record.qual,
                'with_check', policy_record.with_check
            )::text,
            policy_record.cmd
        );
    END LOOP;
    
    RAISE NOTICE 'Backup completed successfully!';
END $$;

-- =============================================================================
-- STEP 3: DISABLE RLS ON ALL TABLES
-- =============================================================================

-- Disable RLS on all application tables
ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on additional tables (if they exist)
DO $$
BEGIN
    -- Check and disable RLS on deliverables table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') THEN
        ALTER TABLE deliverables DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on deliverables table';
    END IF;
    
    -- Check and disable RLS on work_products table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products') THEN
        ALTER TABLE work_products DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on work_products table';
    END IF;
    
    -- Check and disable RLS on verification_reports table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_reports') THEN
        ALTER TABLE verification_reports DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on verification_reports table';
    END IF;
    
    -- Check and disable RLS on project_files table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') THEN
        ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on project_files table';
    END IF;
    
    -- Check and disable RLS on project_status_history table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_status_history') THEN
        ALTER TABLE project_status_history DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on project_status_history table';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: DROP ALL RLS POLICIES
-- =============================================================================

-- Drop policies from main tables
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop policies from freelancer_profiles
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'freelancer_profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON freelancer_profiles';
        RAISE NOTICE 'Dropped policy: % on freelancer_profiles', policy_record.policyname;
    END LOOP;
    
    -- Drop policies from client_profiles
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'client_profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON client_profiles';
        RAISE NOTICE 'Dropped policy: % on client_profiles', policy_record.policyname;
    END LOOP;
    
    -- Drop policies from projects
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON projects';
        RAISE NOTICE 'Dropped policy: % on projects', policy_record.policyname;
    END LOOP;
    
    -- Drop policies from transactions
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'transactions' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON transactions';
        RAISE NOTICE 'Dropped policy: % on transactions', policy_record.policyname;
    END LOOP;
    
    -- Drop policies from messages
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON messages';
        RAISE NOTICE 'Dropped policy: % on messages', policy_record.policyname;
    END LOOP;
    
    -- Drop policies from additional tables
    FOR policy_record IN 
        SELECT tablename, policyname FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('deliverables', 'work_products', 'verification_reports', 'project_files', 'project_status_history')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
        RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
    
    -- Drop storage policies
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND (policyname LIKE '%work%' OR policyname LIKE '%project%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
        RAISE NOTICE 'Dropped storage policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 5: VERIFICATION
-- =============================================================================

-- Verify RLS is disabled on all tables
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

-- Verify no policies remain
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
    'messages', 'deliverables', 'work_products', 'verification_reports', 
    'project_files', 'project_status_history'
);

-- Show backup summary
SELECT 
    'Backup Summary' as info,
    COUNT(*) as total_policies_backed_up
FROM rls_policies_backup;

SELECT 
    'Tables with RLS Disabled' as info,
    COUNT(*) as total_tables
FROM rls_enabled_tables_backup;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES SUCCESSFULLY DISABLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All RLS policies have been disabled for development/testing.';
    RAISE NOTICE 'Your original policies have been backed up to:';
    RAISE NOTICE '- rls_policies_backup table';
    RAISE NOTICE '- rls_enabled_tables_backup table';
    RAISE NOTICE '';
    RAISE NOTICE 'To restore RLS policies later, run the restore script:';
    RAISE NOTICE 'restore_rls_policies.sql';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: This removes all data access restrictions!';
    RAISE NOTICE 'Only use in development/testing environments.';
    RAISE NOTICE '========================================';
END $$;
