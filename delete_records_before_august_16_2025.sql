-- Delete Records Created On or Before August 16th, 2025
-- This script safely deletes records from all tables except authentication tables
-- Date: August 16th, 2025 (2025-08-16)

-- First, let's create a backup of the current data (optional but recommended)
-- Uncomment the following lines if you want to create backups before deletion

/*
-- Backup freelancer_profiles
CREATE TABLE freelancer_profiles_backup_20250816 AS 
SELECT * FROM freelancer_profiles WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup client_profiles
CREATE TABLE client_profiles_backup_20250816 AS 
SELECT * FROM client_profiles WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup projects
CREATE TABLE projects_backup_20250816 AS 
SELECT * FROM projects WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup transactions
CREATE TABLE transactions_backup_20250816 AS 
SELECT * FROM transactions WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup messages
CREATE TABLE messages_backup_20250816 AS 
SELECT * FROM messages WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup deliverables
CREATE TABLE deliverables_backup_20250816 AS 
SELECT * FROM deliverables WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup work_products
CREATE TABLE work_products_backup_20250816 AS 
SELECT * FROM work_products WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup verification_reports
CREATE TABLE verification_reports_backup_20250816 AS 
SELECT * FROM verification_reports WHERE created_at <= '2025-08-16 23:59:59+00';

-- Backup project_files
CREATE TABLE project_files_backup_20250816 AS 
SELECT * FROM project_files WHERE uploaded_at <= '2025-08-16 23:59:59+00';

-- Backup project_status_history
CREATE TABLE project_status_history_backup_20250816 AS 
SELECT * FROM project_status_history WHERE created_at <= '2025-08-16 23:59:59+00';
*/

-- =====================================================
-- ACTUAL DELETION SCRIPT
-- =====================================================

-- Set the cutoff date
DO $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE := '2025-08-16 23:59:59+00';
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting deletion of records created on or before %', cutoff_date;
    
    -- Delete from project_status_history first (child table)
    DELETE FROM project_status_history 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from project_status_history', deleted_count;
    
    -- Delete from verification_reports
    DELETE FROM verification_reports 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from verification_reports', deleted_count;
    
    -- Delete from work_products
    DELETE FROM work_products 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from work_products', deleted_count;
    
    -- Delete from deliverables
    DELETE FROM deliverables 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from deliverables', deleted_count;
    
    -- Delete from project_files
    DELETE FROM project_files 
    WHERE uploaded_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from project_files', deleted_count;
    
    -- Delete from messages
    DELETE FROM messages 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from messages', deleted_count;
    
    -- Delete from transactions
    DELETE FROM transactions 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from transactions', deleted_count;
    
    -- Delete from projects
    DELETE FROM projects 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from projects', deleted_count;
    
    -- Delete from client_profiles
    DELETE FROM client_profiles 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from client_profiles', deleted_count;
    
    -- Delete from freelancer_profiles
    DELETE FROM freelancer_profiles 
    WHERE created_at <= cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from freelancer_profiles', deleted_count;
    
    RAISE NOTICE 'Deletion completed successfully!';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check remaining records in each table
SELECT 'freelancer_profiles' as table_name, COUNT(*) as remaining_records 
FROM freelancer_profiles
UNION ALL
SELECT 'client_profiles', COUNT(*) 
FROM client_profiles
UNION ALL
SELECT 'projects', COUNT(*) 
FROM projects
UNION ALL
SELECT 'transactions', COUNT(*) 
FROM transactions
UNION ALL
SELECT 'messages', COUNT(*) 
FROM messages
UNION ALL
SELECT 'deliverables', COUNT(*) 
FROM deliverables
UNION ALL
SELECT 'work_products', COUNT(*) 
FROM work_products
UNION ALL
SELECT 'verification_reports', COUNT(*) 
FROM verification_reports
UNION ALL
SELECT 'project_files', COUNT(*) 
FROM project_files
UNION ALL
SELECT 'project_status_history', COUNT(*) 
FROM project_status_history
ORDER BY table_name;

-- Check for any records that might have been missed (created before cutoff but not deleted)
SELECT 'freelancer_profiles' as table_name, COUNT(*) as old_records 
FROM freelancer_profiles WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'client_profiles', COUNT(*) 
FROM client_profiles WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'projects', COUNT(*) 
FROM projects WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'transactions', COUNT(*) 
FROM transactions WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'messages', COUNT(*) 
FROM messages WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'deliverables', COUNT(*) 
FROM deliverables WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'work_products', COUNT(*) 
FROM work_products WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'verification_reports', COUNT(*) 
FROM verification_reports WHERE created_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'project_files', COUNT(*) 
FROM project_files WHERE uploaded_at <= '2025-08-16 23:59:59+00'
UNION ALL
SELECT 'project_status_history', COUNT(*) 
FROM project_status_history WHERE created_at <= '2025-08-16 23:59:59+00'
ORDER BY table_name;

-- =====================================================
-- CLEANUP BACKUP TABLES (Optional - Uncomment if needed)
-- =====================================================

/*
-- Uncomment these lines if you want to clean up backup tables after verification
DROP TABLE IF EXISTS freelancer_profiles_backup_20250816;
DROP TABLE IF EXISTS client_profiles_backup_20250816;
DROP TABLE IF EXISTS projects_backup_20250816;
DROP TABLE IF EXISTS transactions_backup_20250816;
DROP TABLE IF EXISTS messages_backup_20250816;
DROP TABLE IF EXISTS deliverables_backup_20250816;
DROP TABLE IF EXISTS work_products_backup_20250816;
DROP TABLE IF EXISTS verification_reports_backup_20250816;
DROP TABLE IF EXISTS project_files_backup_20250816;
DROP TABLE IF EXISTS project_status_history_backup_20250816;
*/
