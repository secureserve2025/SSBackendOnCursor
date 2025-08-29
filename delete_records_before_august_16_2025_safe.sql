-- Delete Records Created On or Before August 16th, 2025 (Safe Version)
-- This script safely deletes records from all tables except authentication tables
-- Date: August 16th, 2025 (2025-08-16)
-- This version checks for table existence before deletion

-- =====================================================
-- ACTUAL DELETION SCRIPT (Safe Version)
-- =====================================================

-- Set the cutoff date
DO $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE := '2025-08-16 23:59:59+00';
    deleted_count INTEGER := 0;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Starting deletion of records created on or before %', cutoff_date;
    
    -- Check and delete from project_status_history if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_status_history'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM project_status_history 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from project_status_history', deleted_count;
    ELSE
        RAISE NOTICE 'Table project_status_history does not exist, skipping...';
    END IF;
    
    -- Check and delete from verification_reports if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_reports'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM verification_reports 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from verification_reports', deleted_count;
    ELSE
        RAISE NOTICE 'Table verification_reports does not exist, skipping...';
    END IF;
    
    -- Check and delete from work_products if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'work_products'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM work_products 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from work_products', deleted_count;
    ELSE
        RAISE NOTICE 'Table work_products does not exist, skipping...';
    END IF;
    
    -- Check and delete from deliverables if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deliverables'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM deliverables 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from deliverables', deleted_count;
    ELSE
        RAISE NOTICE 'Table deliverables does not exist, skipping...';
    END IF;
    
    -- Check and delete from project_files if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_files'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM project_files 
        WHERE uploaded_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from project_files', deleted_count;
    ELSE
        RAISE NOTICE 'Table project_files does not exist, skipping...';
    END IF;
    
    -- Check and delete from messages if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM messages 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from messages', deleted_count;
    ELSE
        RAISE NOTICE 'Table messages does not exist, skipping...';
    END IF;
    
    -- Check and delete from transactions if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM transactions 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from transactions', deleted_count;
    ELSE
        RAISE NOTICE 'Table transactions does not exist, skipping...';
    END IF;
    
    -- Check and delete from projects if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM projects 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from projects', deleted_count;
    ELSE
        RAISE NOTICE 'Table projects does not exist, skipping...';
    END IF;
    
    -- Check and delete from client_profiles if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM client_profiles 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from client_profiles', deleted_count;
    ELSE
        RAISE NOTICE 'Table client_profiles does not exist, skipping...';
    END IF;
    
    -- Check and delete from freelancer_profiles if it exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'freelancer_profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM freelancer_profiles 
        WHERE created_at <= cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % records from freelancer_profiles', deleted_count;
    ELSE
        RAISE NOTICE 'Table freelancer_profiles does not exist, skipping...';
    END IF;
    
    RAISE NOTICE 'Deletion completed successfully!';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Safe Version)
-- =====================================================

-- Check which tables exist and their record counts
SELECT 
    table_name,
    CASE 
        WHEN table_exists THEN remaining_records 
        ELSE NULL 
    END as remaining_records,
    CASE 
        WHEN table_exists THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status
FROM (
    SELECT 'freelancer_profiles' as table_name,
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'freelancer_profiles') as table_exists,
           (SELECT COUNT(*) FROM freelancer_profiles) as remaining_records
    UNION ALL
    SELECT 'client_profiles',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_profiles'),
           (SELECT COUNT(*) FROM client_profiles)
    UNION ALL
    SELECT 'projects',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects'),
           (SELECT COUNT(*) FROM projects)
    UNION ALL
    SELECT 'transactions',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions'),
           (SELECT COUNT(*) FROM transactions)
    UNION ALL
    SELECT 'messages',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'),
           (SELECT COUNT(*) FROM messages)
    UNION ALL
    SELECT 'deliverables',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliverables'),
           (SELECT COUNT(*) FROM deliverables)
    UNION ALL
    SELECT 'work_products',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_products'),
           (SELECT COUNT(*) FROM work_products)
    UNION ALL
    SELECT 'verification_reports',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_reports'),
           (SELECT COUNT(*) FROM verification_reports)
    UNION ALL
    SELECT 'project_files',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_files'),
           (SELECT COUNT(*) FROM project_files)
    UNION ALL
    SELECT 'project_status_history',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_status_history'),
           (SELECT COUNT(*) FROM project_status_history)
) as table_info
ORDER BY table_name;

-- Check for any records that might have been missed (only for existing tables)
SELECT 
    table_name,
    CASE 
        WHEN table_exists THEN old_records 
        ELSE NULL 
    END as old_records,
    CASE 
        WHEN table_exists THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status
FROM (
    SELECT 'freelancer_profiles' as table_name,
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'freelancer_profiles') as table_exists,
           (SELECT COUNT(*) FROM freelancer_profiles WHERE created_at <= '2025-08-16 23:59:59+00') as old_records
    UNION ALL
    SELECT 'client_profiles',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_profiles'),
           (SELECT COUNT(*) FROM client_profiles WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'projects',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects'),
           (SELECT COUNT(*) FROM projects WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'transactions',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions'),
           (SELECT COUNT(*) FROM transactions WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'messages',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'),
           (SELECT COUNT(*) FROM messages WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'deliverables',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliverables'),
           (SELECT COUNT(*) FROM deliverables WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'work_products',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_products'),
           (SELECT COUNT(*) FROM work_products WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'verification_reports',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_reports'),
           (SELECT COUNT(*) FROM verification_reports WHERE created_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'project_files',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_files'),
           (SELECT COUNT(*) FROM project_files WHERE uploaded_at <= '2025-08-16 23:59:59+00')
    UNION ALL
    SELECT 'project_status_history',
           EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_status_history'),
           (SELECT COUNT(*) FROM project_status_history WHERE created_at <= '2025-08-16 23:59:59+00')
) as table_info
ORDER BY table_name;
