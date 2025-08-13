-- Fix Foreign Key Relationships Based on Actual Database Structure
-- This script safely fixes the foreign key issues by checking actual constraints first

-- =============================================================================
-- PART 1: INVESTIGATE CURRENT DATABASE STRUCTURE
-- =============================================================================

-- Check what unique constraints exist on profile tables
SELECT 'CURRENT UNIQUE CONSTRAINTS ON PROFILE TABLES' as info;

SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('client_profiles', 'freelancer_profiles')
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY table_name, constraint_name;

-- Check what columns have unique constraints
SELECT 'UNIQUE CONSTRAINT DETAILS' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('client_profiles', 'freelancer_profiles')
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, kcu.ordinal_position;

-- Check current projects table structure
SELECT 'CURRENT PROJECTS TABLE STRUCTURE' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- =============================================================================
-- PART 2: SAFE FOREIGN KEY RELATIONSHIP FIX
-- =============================================================================

DO $$ 
DECLARE
    client_id_type TEXT;
    freelancer_id_type TEXT;
    client_unique_exists BOOLEAN := FALSE;
    freelancer_unique_exists BOOLEAN := FALSE;
    user_id_unique_exists BOOLEAN := FALSE;
    freelancer_id_unique_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE 'Starting safe foreign key relationship fix...';
    
    -- Get current column types in projects table
    SELECT data_type INTO client_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'client_id';
    
    SELECT data_type INTO freelancer_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'freelancer_id';
    
    RAISE NOTICE 'Projects table types - client_id: %, freelancer_id: %', client_id_type, freelancer_id_type;
    
    -- Check what unique constraints exist on profile tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'client_profiles' 
        AND kcu.column_name = 'client_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) INTO client_unique_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'client_profiles' 
        AND kcu.column_name = 'user_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) INTO user_id_unique_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'freelancer_profiles' 
        AND kcu.column_name = 'freelancer_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) INTO freelancer_id_unique_exists;
    
    RAISE NOTICE 'Unique constraints - client_id: %, user_id: %, freelancer_id: %', 
        client_unique_exists, user_id_unique_exists, freelancer_id_unique_exists;
    
    -- Drop any existing foreign key constraints first
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_freelancer_id_fkey;
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_client_id;
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_freelancer_id;
    
    RAISE NOTICE 'Dropped existing foreign key constraints';
    
    -- Add foreign key constraints based on what unique constraints actually exist
    
    -- For client_id relationship
    IF client_id_type = 'uuid' AND user_id_unique_exists THEN
        -- projects.client_id (UUID) → client_profiles.user_id (UUID with unique constraint)
        ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES client_profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added UUID foreign key: projects.client_id → client_profiles.user_id';
        
    ELSIF client_id_type != 'uuid' AND client_unique_exists THEN
        -- projects.client_id (VARCHAR) → client_profiles.client_id (VARCHAR with unique constraint)
        ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES client_profiles(client_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added VARCHAR foreign key: projects.client_id → client_profiles.client_id';
        
    ELSE
        RAISE NOTICE 'Cannot create client_id foreign key - no suitable unique constraint found';
        RAISE NOTICE 'client_id_type: %, client_unique_exists: %, user_id_unique_exists: %', 
            client_id_type, client_unique_exists, user_id_unique_exists;
    END IF;
    
    -- For freelancer_id relationship
    IF freelancer_id_type = 'uuid' THEN
        -- projects.freelancer_id (UUID) → freelancer_profiles.user_id (UUID with unique constraint)
        IF user_id_unique_exists THEN
            ALTER TABLE projects ADD CONSTRAINT projects_freelancer_id_fkey 
            FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(user_id) ON DELETE CASCADE;
            RAISE NOTICE 'Added UUID foreign key: projects.freelancer_id → freelancer_profiles.user_id';
        ELSE
            RAISE NOTICE 'Cannot create UUID freelancer_id foreign key - no unique constraint on user_id';
        END IF;
        
    ELSIF freelancer_id_type != 'uuid' AND freelancer_id_unique_exists THEN
        -- projects.freelancer_id (VARCHAR) → freelancer_profiles.freelancer_id (VARCHAR with unique constraint)
        ALTER TABLE projects ADD CONSTRAINT projects_freelancer_id_fkey 
        FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(freelancer_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added VARCHAR foreign key: projects.freelancer_id → freelancer_profiles.freelancer_id';
        
    ELSE
        RAISE NOTICE 'Cannot create freelancer_id foreign key - no suitable unique constraint found';
        RAISE NOTICE 'freelancer_id_type: %, freelancer_id_unique_exists: %', 
            freelancer_id_type, freelancer_id_unique_exists;
    END IF;
    
END $$;

-- =============================================================================
-- PART 3: CREATE MISSING UNIQUE CONSTRAINTS IF NEEDED
-- =============================================================================

-- Add unique constraints if they're missing and would be useful
DO $$
BEGIN
    -- Ensure client_id has unique constraint (needed for foreign key references)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'client_profiles' 
        AND kcu.column_name = 'client_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) THEN
        ALTER TABLE client_profiles ADD CONSTRAINT unique_client_id UNIQUE (client_id);
        RAISE NOTICE 'Added unique constraint on client_profiles.client_id';
    END IF;
    
    -- Ensure freelancer_id has unique constraint (needed for foreign key references)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'freelancer_profiles' 
        AND kcu.column_name = 'freelancer_id'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ) THEN
        ALTER TABLE freelancer_profiles ADD CONSTRAINT unique_freelancer_id UNIQUE (freelancer_id);
        RAISE NOTICE 'Added unique constraint on freelancer_profiles.freelancer_id';
    END IF;
    
    -- Ensure email unique constraints exist
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
-- PART 4: RETRY FOREIGN KEY CREATION AFTER ADDING UNIQUE CONSTRAINTS
-- =============================================================================

DO $$ 
DECLARE
    client_id_type TEXT;
    freelancer_id_type TEXT;
    client_fk_exists BOOLEAN := FALSE;
    freelancer_fk_exists BOOLEAN := FALSE;
BEGIN
    -- Get current column types again
    SELECT data_type INTO client_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'client_id';
    
    SELECT data_type INTO freelancer_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'freelancer_id';
    
    -- Check if foreign keys were created successfully
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'projects_client_id_fkey'
    ) INTO client_fk_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'projects_freelancer_id_fkey'
    ) INTO freelancer_fk_exists;
    
    -- If foreign keys don't exist, try to create them with the pattern that makes most sense
    IF NOT client_fk_exists THEN
        IF client_id_type = 'uuid' THEN
            -- Try UUID reference to user_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey 
                FOREIGN KEY (client_id) REFERENCES client_profiles(user_id) ON DELETE CASCADE;
                RAISE NOTICE 'Successfully added UUID foreign key: projects.client_id → client_profiles.user_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create UUID foreign key for client_id: %', SQLERRM;
            END;
        ELSE
            -- Try VARCHAR reference to client_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey 
                FOREIGN KEY (client_id) REFERENCES client_profiles(client_id) ON DELETE CASCADE;
                RAISE NOTICE 'Successfully added VARCHAR foreign key: projects.client_id → client_profiles.client_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create VARCHAR foreign key for client_id: %', SQLERRM;
            END;
        END IF;
    END IF;
    
    IF NOT freelancer_fk_exists THEN
        IF freelancer_id_type = 'uuid' THEN
            -- Try UUID reference to user_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_freelancer_id_fkey 
                FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(user_id) ON DELETE CASCADE;
                RAISE NOTICE 'Successfully added UUID foreign key: projects.freelancer_id → freelancer_profiles.user_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create UUID foreign key for freelancer_id: %', SQLERRM;
            END;
        ELSE
            -- Try VARCHAR reference to freelancer_id
            BEGIN
                ALTER TABLE projects ADD CONSTRAINT projects_freelancer_id_fkey 
                FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(freelancer_id) ON DELETE CASCADE;
                RAISE NOTICE 'Successfully added VARCHAR foreign key: projects.freelancer_id → freelancer_profiles.freelancer_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create VARCHAR foreign key for freelancer_id: %', SQLERRM;
            END;
        END IF;
    END IF;
    
END $$;

-- =============================================================================
-- PART 5: VERIFICATION
-- =============================================================================

-- Show final foreign key relationships
SELECT 'FINAL FOREIGN KEY RELATIONSHIPS' as status;

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

-- Show unique constraints
SELECT 'UNIQUE CONSTRAINTS ON PROFILE TABLES' as status;

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('client_profiles', 'freelancer_profiles')
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, kcu.column_name;

-- Test the relationships
SELECT 'TESTING JOIN RELATIONSHIPS' as status;

-- Test project-client join
SELECT 'Client join test' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM projects p 
            LEFT JOIN client_profiles c ON p.client_id = c.client_id 
            OR p.client_id = c.user_id::text
        ) THEN 'Join pattern identified'
        ELSE 'No join pattern found'
    END as result;

-- Test project-freelancer join  
SELECT 'Freelancer join test' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM projects p 
            LEFT JOIN freelancer_profiles f ON p.freelancer_id = f.freelancer_id 
            OR p.freelancer_id = f.user_id::text
        ) THEN 'Join pattern identified'
        ELSE 'No join pattern found'
    END as result;

SELECT '✅ FOREIGN KEY RELATIONSHIP FIX COMPLETED' as final_status;




