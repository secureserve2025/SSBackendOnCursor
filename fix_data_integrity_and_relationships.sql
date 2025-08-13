-- Fix Data Integrity Issues and Create Foreign Key Relationships
-- This script handles orphaned data and creates proper relationships safely

-- =============================================================================
-- PART 1: ANALYZE DATA INTEGRITY ISSUES
-- =============================================================================

SELECT 'ANALYZING DATA INTEGRITY ISSUES' as analysis_header;

-- Check projects with missing client references
SELECT 'PROJECTS WITH MISSING CLIENT REFERENCES' as check_name;

SELECT 
    p.id,
    p.project_id,
    p.client_id,
    p.project_name,
    CASE 
        WHEN c.client_id IS NOT NULL THEN 'Client exists'
        WHEN c.user_id::text = p.client_id THEN 'Client exists (UUID match)'
        ELSE 'MISSING CLIENT'
    END as client_status
FROM projects p
LEFT JOIN client_profiles c ON (p.client_id = c.client_id OR p.client_id = c.user_id::text)
WHERE c.client_id IS NULL AND c.user_id IS NULL
LIMIT 10;

-- Check projects with missing freelancer references
SELECT 'PROJECTS WITH MISSING FREELANCER REFERENCES' as check_name;

SELECT 
    p.id,
    p.project_id,
    p.freelancer_id,
    p.project_name,
    CASE 
        WHEN f.freelancer_id IS NOT NULL THEN 'Freelancer exists'
        WHEN f.user_id::text = p.freelancer_id THEN 'Freelancer exists (UUID match)'
        ELSE 'MISSING FREELANCER'
    END as freelancer_status
FROM projects p
LEFT JOIN freelancer_profiles f ON (p.freelancer_id = f.freelancer_id OR p.freelancer_id = f.user_id::text)
WHERE f.freelancer_id IS NULL AND f.user_id IS NULL
LIMIT 10;

-- Show current table structures
SELECT 'CLIENT PROFILES STRUCTURE' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_profiles'
ORDER BY ordinal_position;

SELECT 'FREELANCER PROFILES STRUCTURE' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles'
ORDER BY ordinal_position;

SELECT 'PROJECTS TABLE STRUCTURE' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- =============================================================================
-- PART 2: HANDLE ORPHANED DATA (SAFE OPTIONS)
-- =============================================================================

-- Create a backup of projects before making changes
CREATE TABLE IF NOT EXISTS projects_backup AS 
SELECT * FROM projects WHERE 1=0; -- Create structure only initially

-- Insert current projects into backup (if not already done)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM projects_backup LIMIT 1) THEN
        INSERT INTO projects_backup SELECT * FROM projects;
        RAISE NOTICE 'Created backup of % projects', (SELECT COUNT(*) FROM projects_backup);
    ELSE
        RAISE NOTICE 'Backup already exists with % projects', (SELECT COUNT(*) FROM projects_backup);
    END IF;
END $$;

-- =============================================================================
-- PART 3: CLEAN UP ORPHANED PROJECTS DATA
-- =============================================================================

-- Option A: Delete projects with missing client/freelancer references
-- (Use this if the orphaned projects are test data or invalid)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned projects first
    SELECT COUNT(*) INTO orphaned_count
    FROM projects p
    WHERE NOT EXISTS (
        SELECT 1 FROM client_profiles c 
        WHERE p.client_id = c.client_id OR p.client_id = c.user_id::text
    )
    OR NOT EXISTS (
        SELECT 1 FROM freelancer_profiles f 
        WHERE p.freelancer_id = f.freelancer_id OR p.freelancer_id = f.user_id::text
    );
    
    RAISE NOTICE 'Found % orphaned projects', orphaned_count;
    
    -- Only proceed if there are orphaned projects but not too many (safety check)
    IF orphaned_count > 0 AND orphaned_count < 100 THEN
        -- Delete projects with missing client references
        DELETE FROM projects 
        WHERE NOT EXISTS (
            SELECT 1 FROM client_profiles c 
            WHERE projects.client_id = c.client_id OR projects.client_id = c.user_id::text
        );
        
        -- Delete projects with missing freelancer references
        DELETE FROM projects 
        WHERE NOT EXISTS (
            SELECT 1 FROM freelancer_profiles f 
            WHERE projects.freelancer_id = f.freelancer_id OR projects.freelancer_id = f.user_id::text
        );
        
        RAISE NOTICE 'Cleaned up orphaned projects';
    ELSIF orphaned_count >= 100 THEN
        RAISE NOTICE 'Too many orphaned projects (%). Manual review needed.', orphaned_count;
    ELSE
        RAISE NOTICE 'No orphaned projects found';
    END IF;
END $$;

-- =============================================================================
-- PART 4: CREATE MISSING UNIQUE CONSTRAINTS
-- =============================================================================

-- Ensure we have the necessary unique constraints for foreign keys
DO $$
BEGIN
    -- Add unique constraint on client_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'client_profiles' 
        AND kcu.column_name = 'client_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) THEN
        ALTER TABLE client_profiles ADD CONSTRAINT unique_client_id UNIQUE (client_id);
        RAISE NOTICE 'Added unique constraint on client_profiles.client_id';
    ELSE
        RAISE NOTICE 'Unique constraint on client_profiles.client_id already exists';
    END IF;
    
    -- Add unique constraint on freelancer_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'freelancer_profiles' 
        AND kcu.column_name = 'freelancer_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) THEN
        ALTER TABLE freelancer_profiles ADD CONSTRAINT unique_freelancer_id UNIQUE (freelancer_id);
        RAISE NOTICE 'Added unique constraint on freelancer_profiles.freelancer_id';
    ELSE
        RAISE NOTICE 'Unique constraint on freelancer_profiles.freelancer_id already exists';
    END IF;
    
    -- Add unique constraint on email fields if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'client_profiles' 
        AND kcu.column_name = 'email'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) THEN
        ALTER TABLE client_profiles ADD CONSTRAINT unique_client_email UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on client_profiles.email';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'freelancer_profiles' 
        AND kcu.column_name = 'email'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) THEN
        ALTER TABLE freelancer_profiles ADD CONSTRAINT unique_freelancer_email UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on freelancer_profiles.email';
    END IF;
    
END $$;

-- =============================================================================
-- PART 5: CREATE FOREIGN KEY RELATIONSHIPS (SAFE)
-- =============================================================================

DO $$ 
DECLARE
    client_id_type TEXT;
    freelancer_id_type TEXT;
    projects_count INTEGER;
    valid_projects_count INTEGER;
BEGIN
    -- Get column types
    SELECT data_type INTO client_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'client_id';
    
    SELECT data_type INTO freelancer_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'freelancer_id';
    
    -- Count total and valid projects
    SELECT COUNT(*) INTO projects_count FROM projects;
    
    SELECT COUNT(*) INTO valid_projects_count
    FROM projects p
    WHERE EXISTS (
        SELECT 1 FROM client_profiles c 
        WHERE p.client_id = c.client_id OR p.client_id = c.user_id::text
    )
    AND EXISTS (
        SELECT 1 FROM freelancer_profiles f 
        WHERE p.freelancer_id = f.freelancer_id OR p.freelancer_id = f.user_id::text
    );
    
    RAISE NOTICE 'Projects: % total, % valid references', projects_count, valid_projects_count;
    RAISE NOTICE 'Column types - client_id: %, freelancer_id: %', client_id_type, freelancer_id_type;
    
    -- Only create foreign keys if we have clean data
    IF projects_count = valid_projects_count THEN
        
        -- Drop any existing foreign key constraints
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_freelancer_id_fkey;
        
        -- Create client_id foreign key
        IF client_id_type = 'uuid' THEN
            -- UUID reference to user_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey 
                FOREIGN KEY (client_id) REFERENCES client_profiles(user_id) ON DELETE CASCADE;
                RAISE NOTICE 'Created foreign key: projects.client_id (UUID) → client_profiles.user_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create UUID client foreign key: %', SQLERRM;
            END;
        ELSE
            -- VARCHAR reference to client_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey 
                FOREIGN KEY (client_id) REFERENCES client_profiles(client_id) ON DELETE CASCADE;
                RAISE NOTICE 'Created foreign key: projects.client_id (VARCHAR) → client_profiles.client_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create VARCHAR client foreign key: %', SQLERRM;
            END;
        END IF;
        
        -- Create freelancer_id foreign key
        IF freelancer_id_type = 'uuid' THEN
            -- UUID reference to user_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_freelancer_id_fkey 
                FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(user_id) ON DELETE CASCADE;
                RAISE NOTICE 'Created foreign key: projects.freelancer_id (UUID) → freelancer_profiles.user_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create UUID freelancer foreign key: %', SQLERRM;
            END;
        ELSE
            -- VARCHAR reference to freelancer_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_freelancer_id_fkey 
                FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(freelancer_id) ON DELETE CASCADE;
                RAISE NOTICE 'Created foreign key: projects.freelancer_id (VARCHAR) → freelancer_profiles.freelancer_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create VARCHAR freelancer foreign key: %', SQLERRM;
            END;
        END IF;
        
    ELSE
        RAISE NOTICE 'Cannot create foreign keys - data integrity issues remain';
        RAISE NOTICE 'Manual cleanup needed for % invalid project references', (projects_count - valid_projects_count);
    END IF;
    
END $$;

-- =============================================================================
-- PART 6: VERIFY RELATIONSHIPS AND PROVIDE GUIDANCE
-- =============================================================================

-- Check final foreign key status
SELECT 'FOREIGN KEY VERIFICATION' as verification_header;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'projects'
ORDER BY tc.constraint_name;

-- Test joins to ensure they work
SELECT 'TESTING JOIN FUNCTIONALITY' as join_test_header;

-- Test project-client join
SELECT 'Project-Client Join Test' as test_name,
    COUNT(*) as project_count,
    COUNT(c.client_id) as successful_joins
FROM projects p
LEFT JOIN client_profiles c ON (p.client_id = c.client_id OR p.client_id = c.user_id::text);

-- Test project-freelancer join
SELECT 'Project-Freelancer Join Test' as test_name,
    COUNT(*) as project_count,
    COUNT(f.freelancer_id) as successful_joins
FROM projects p
LEFT JOIN freelancer_profiles f ON (p.freelancer_id = f.freelancer_id OR p.freelancer_id = f.user_id::text);

-- Show any remaining data issues
SELECT 'REMAINING DATA ISSUES CHECK' as final_check;

SELECT 'Projects with missing client references' as issue_type, COUNT(*) as count
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM client_profiles c 
    WHERE p.client_id = c.client_id OR p.client_id = c.user_id::text
)
UNION ALL
SELECT 'Projects with missing freelancer references' as issue_type, COUNT(*) as count
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM freelancer_profiles f 
    WHERE p.freelancer_id = f.freelancer_id OR p.freelancer_id = f.user_id::text
);

-- Final status
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'projects' 
            AND constraint_name IN ('projects_client_id_fkey', 'projects_freelancer_id_fkey')
        ) THEN '✅ DATA INTEGRITY AND RELATIONSHIPS FIXED!'
        ELSE '⚠️ MANUAL INTERVENTION NEEDED - Check output above'
    END as final_status;

-- Show backup information
SELECT 'BACKUP INFORMATION' as backup_info;
SELECT 
    'projects_backup' as backup_table,
    COUNT(*) as backed_up_records,
    'Available for recovery if needed' as note
FROM projects_backup;




