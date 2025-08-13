-- Convert Existing Data Records to IST
-- This script updates all existing timestamps from UTC to IST
-- ⚠️  BACKUP YOUR DATA BEFORE RUNNING THIS SCRIPT

-- =============================================================================
-- IMPORTANT: Read this before running!
-- =============================================================================
-- This script will PERMANENTLY change your existing timestamp data
-- Make sure you have a backup of your database before proceeding
-- 
-- What this does:
-- 1. Converts all existing UTC timestamps to IST 
-- 2. Updates created_at and updated_at columns
-- 3. Updates any other timestamp columns found
-- 
-- After running this script:
-- - All timestamps (old and new) will be in IST
-- - Historical data will show IST times
-- - Everything will be consistent
-- =============================================================================

-- Check existing data before conversion
SELECT 'BEFORE CONVERSION - Sample Data' as status;

-- Show sample client profiles
SELECT 
    'Client Profiles Sample' as table_name,
    client_id,
    created_at as original_timestamp,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as would_become_ist
FROM client_profiles 
WHERE created_at IS NOT NULL
LIMIT 3;

-- Show sample freelancer profiles  
SELECT 
    'Freelancer Profiles Sample' as table_name,
    freelancer_id,
    created_at as original_timestamp,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as would_become_ist
FROM freelancer_profiles 
WHERE created_at IS NOT NULL
LIMIT 3;

-- Show sample projects
SELECT 
    'Projects Sample' as table_name,
    project_id,
    created_at as original_timestamp,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as would_become_ist
FROM projects 
WHERE created_at IS NOT NULL
LIMIT 3;

-- =============================================================================
-- CONVERSION SECTION - Uncomment to actually convert data
-- =============================================================================

-- STEP 1: Convert client_profiles timestamps
/*
UPDATE client_profiles 
SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

SELECT 'Client profiles converted to IST' as status, COUNT(*) as records_updated 
FROM client_profiles;
*/

-- STEP 2: Convert freelancer_profiles timestamps  
/*
UPDATE freelancer_profiles 
SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

SELECT 'Freelancer profiles converted to IST' as status, COUNT(*) as records_updated 
FROM freelancer_profiles;
*/

-- STEP 3: Convert projects timestamps
/*
UPDATE projects 
SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

SELECT 'Projects converted to IST' as status, COUNT(*) as records_updated 
FROM projects;
*/

-- STEP 4: Convert deliverables timestamps (if table exists)
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') THEN
        UPDATE deliverables 
        SET 
            created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
            updated_at = CASE 
                WHEN updated_at IS NOT NULL 
                THEN updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END,
            completed_at = CASE 
                WHEN completed_at IS NOT NULL 
                THEN completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END
        WHERE created_at IS NOT NULL;
        
        RAISE NOTICE 'Deliverables converted to IST';
    END IF;
END $$;
*/

-- STEP 5: Convert work_products timestamps (if table exists)
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products') THEN
        UPDATE work_products 
        SET 
            created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
            updated_at = CASE 
                WHEN updated_at IS NOT NULL 
                THEN updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END,
            uploaded_at = CASE 
                WHEN uploaded_at IS NOT NULL 
                THEN uploaded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END,
            reviewed_at = CASE 
                WHEN reviewed_at IS NOT NULL 
                THEN reviewed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END
        WHERE created_at IS NOT NULL;
        
        RAISE NOTICE 'Work products converted to IST';
    END IF;
END $$;
*/

-- STEP 6: Convert transactions timestamps (if table exists)
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        UPDATE transactions 
        SET 
            created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
            updated_at = CASE 
                WHEN updated_at IS NOT NULL 
                THEN updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END,
            processed_at = CASE 
                WHEN processed_at IS NOT NULL 
                THEN processed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END
        WHERE created_at IS NOT NULL;
        
        RAISE NOTICE 'Transactions converted to IST';
    END IF;
END $$;
*/

-- STEP 7: Convert messages timestamps (if table exists)
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        UPDATE messages 
        SET 
            created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
            read_at = CASE 
                WHEN read_at IS NOT NULL 
                THEN read_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
                ELSE NULL 
            END
        WHERE created_at IS NOT NULL;
        
        RAISE NOTICE 'Messages converted to IST';
    END IF;
END $$;
*/

-- =============================================================================
-- VERIFICATION SECTION - Check data after conversion
-- =============================================================================

-- Show data after conversion (uncomment after running conversion)
/*
SELECT 'AFTER CONVERSION - Sample Data' as status;

-- Show converted client profiles
SELECT 
    'Client Profiles (IST)' as table_name,
    client_id,
    created_at as ist_timestamp,
    to_char(created_at, 'DD-MM-YYYY HH24:MI:SS') as formatted_ist
FROM client_profiles 
WHERE created_at IS NOT NULL
LIMIT 3;

-- Show converted freelancer profiles  
SELECT 
    'Freelancer Profiles (IST)' as table_name,
    freelancer_id,
    created_at as ist_timestamp,
    to_char(created_at, 'DD-MM-YYYY HH24:MI:SS') as formatted_ist
FROM freelancer_profiles 
WHERE created_at IS NOT NULL
LIMIT 3;

-- Show converted projects
SELECT 
    'Projects (IST)' as table_name,
    project_id,
    created_at as ist_timestamp,
    to_char(created_at, 'DD-MM-YYYY HH24:MI:SS') as formatted_ist
FROM projects 
WHERE created_at IS NOT NULL
LIMIT 3;

SELECT 'SUCCESS: All existing data converted to IST!' as status;
*/

-- =============================================================================
-- ROLLBACK SECTION - Use if you need to revert (DANGEROUS!)
-- =============================================================================

-- ⚠️  ONLY USE IF YOU NEED TO REVERT AND UNDERSTAND THE RISKS
-- This converts IST timestamps back to UTC (assumes data was originally UTC)
/*
-- ROLLBACK client_profiles
UPDATE client_profiles 
SET 
    created_at = created_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
    updated_at = updated_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE created_at IS NOT NULL;

-- ROLLBACK freelancer_profiles
UPDATE freelancer_profiles 
SET 
    created_at = created_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
    updated_at = updated_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE created_at IS NOT NULL;

-- ROLLBACK projects
UPDATE projects 
SET 
    created_at = created_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
    updated_at = updated_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE created_at IS NOT NULL;
*/




