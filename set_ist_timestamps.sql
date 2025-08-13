-- Set Database Timestamps to IST (Indian Standard Time)
-- This script updates all timestamp defaults and functions to use Asia/Kolkata timezone

-- =============================================================================
-- STEP 1: Set database timezone to IST
-- =============================================================================

-- Set the timezone for this session
SET timezone = 'Asia/Kolkata';

-- Verify timezone setting
SELECT current_setting('TIMEZONE') as current_timezone;
SELECT NOW() as current_ist_time;

-- =============================================================================
-- STEP 2: Create IST timestamp functions
-- =============================================================================

-- Function to get current IST timestamp
CREATE OR REPLACE FUNCTION now_ist()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'Asia/Kolkata';
END;
$$ LANGUAGE plpgsql;

-- Function to convert any timestamp to IST
CREATE OR REPLACE FUNCTION to_ist(input_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN input_timestamp AT TIME ZONE 'Asia/Kolkata';
END;
$$ LANGUAGE plpgsql;

-- Function for IST date formatting
CREATE OR REPLACE FUNCTION format_ist_timestamp(input_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
    RETURN to_char(input_timestamp AT TIME ZONE 'Asia/Kolkata', 'DD-MM-YYYY HH24:MI:SS IST');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: Update all table defaults to use IST
-- =============================================================================

-- Update client_profiles table
ALTER TABLE client_profiles 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE client_profiles 
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- Update freelancer_profiles table
ALTER TABLE freelancer_profiles 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE freelancer_profiles 
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- Update projects table
ALTER TABLE projects 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE projects 
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- Update project_files table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_files') THEN
        EXECUTE 'ALTER TABLE project_files ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_files' AND column_name = 'uploaded_at') THEN
            EXECUTE 'ALTER TABLE project_files ALTER COLUMN uploaded_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
    END IF;
END $$;

-- Update deliverables table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') THEN
        EXECUTE 'ALTER TABLE deliverables ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'updated_at') THEN
            EXECUTE 'ALTER TABLE deliverables ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'completed_at') THEN
            EXECUTE 'ALTER TABLE deliverables ALTER COLUMN completed_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
    END IF;
END $$;

-- Update work_products table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_products') THEN
        EXECUTE 'ALTER TABLE work_products ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_products' AND column_name = 'updated_at') THEN
            EXECUTE 'ALTER TABLE work_products ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_products' AND column_name = 'uploaded_at') THEN
            EXECUTE 'ALTER TABLE work_products ALTER COLUMN uploaded_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_products' AND column_name = 'reviewed_at') THEN
            EXECUTE 'ALTER TABLE work_products ALTER COLUMN reviewed_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
    END IF;
END $$;

-- Update transactions table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        EXECUTE 'ALTER TABLE transactions ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'updated_at') THEN
            EXECUTE 'ALTER TABLE transactions ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'processed_at') THEN
            EXECUTE 'ALTER TABLE transactions ALTER COLUMN processed_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
    END IF;
END $$;

-- Update messages table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        EXECUTE 'ALTER TABLE messages ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'read_at') THEN
            EXECUTE 'ALTER TABLE messages ALTER COLUMN read_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
        END IF;
    END IF;
END $$;

-- Update profile_audit_log table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_audit_log') THEN
        EXECUTE 'ALTER TABLE profile_audit_log ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'')';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Update trigger functions to use IST
-- =============================================================================

-- Update the updated_at trigger function to use IST
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'Asia/Kolkata';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update profile creation functions to use IST
CREATE OR REPLACE FUNCTION handle_new_client()
RETURNS TRIGGER AS $$
DECLARE
    new_client_id VARCHAR(20);
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique client_id
    new_client_id := generate_client_id();
    ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
    
    -- Insert new client profile with IST timestamps
    INSERT INTO client_profiles (
        user_id, 
        client_id, 
        email, 
        full_name, 
        mobile_number,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id, 
        new_client_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
        ist_timestamp,
        ist_timestamp
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating client profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
DECLARE
    new_freelancer_id VARCHAR(20);
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique freelancer_id
    new_freelancer_id := generate_freelancer_id();
    ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
    
    -- Insert new freelancer profile with IST timestamps
    INSERT INTO freelancer_profiles (
        user_id, 
        freelancer_id, 
        email, 
        full_name, 
        mobile_number,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id, 
        new_freelancer_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
        ist_timestamp,
        ist_timestamp
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating freelancer profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update audit log function to use IST
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    table_name_var VARCHAR(50);
    old_values_json JSONB;
    new_values_json JSONB;
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    table_name_var := TG_TABLE_NAME;
    ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
    
    IF TG_OP = 'INSERT' THEN
        new_values_json := row_to_json(NEW)::jsonb;
        INSERT INTO profile_audit_log (table_name, record_id, user_id, action, new_values, created_at)
        VALUES (table_name_var, NEW.id, NEW.user_id, 'INSERT', new_values_json, ist_timestamp);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        old_values_json := row_to_json(OLD)::jsonb;
        new_values_json := row_to_json(NEW)::jsonb;
        INSERT INTO profile_audit_log (table_name, record_id, user_id, action, old_values, new_values, created_at)
        VALUES (table_name_var, NEW.id, NEW.user_id, 'UPDATE', old_values_json, new_values_json, ist_timestamp);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        old_values_json := row_to_json(OLD)::jsonb;
        INSERT INTO profile_audit_log (table_name, record_id, user_id, action, old_values, created_at)
        VALUES (table_name_var, OLD.id, OLD.user_id, 'DELETE', old_values_json, ist_timestamp);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 5: Update existing records to IST (optional - only if needed)
-- =============================================================================

-- Note: This section updates existing timestamps to IST
-- Only run this if you want to convert existing UTC timestamps to IST

-- Update existing client_profiles timestamps
-- UPDATE client_profiles 
-- SET 
--     created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
-- WHERE created_at IS NOT NULL;

-- Update existing freelancer_profiles timestamps  
-- UPDATE freelancer_profiles 
-- SET 
--     created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
-- WHERE created_at IS NOT NULL;

-- Update existing projects timestamps
-- UPDATE projects 
-- SET 
--     created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
-- WHERE created_at IS NOT NULL;

-- =============================================================================
-- STEP 6: Create utility views for IST display
-- =============================================================================

-- View to display all profiles with IST formatted timestamps
CREATE OR REPLACE VIEW profiles_with_ist AS
SELECT 
    'client' as profile_type,
    client_id as profile_id,
    full_name,
    email,
    format_ist_timestamp(created_at) as created_at_ist,
    format_ist_timestamp(updated_at) as updated_at_ist,
    created_at as created_at_raw,
    updated_at as updated_at_raw
FROM client_profiles
UNION ALL
SELECT 
    'freelancer' as profile_type,
    freelancer_id as profile_id,
    full_name,
    email,
    format_ist_timestamp(created_at) as created_at_ist,
    format_ist_timestamp(updated_at) as updated_at_ist,
    created_at as created_at_raw,
    updated_at as updated_at_raw
FROM freelancer_profiles;

-- =============================================================================
-- STEP 7: Test IST functionality
-- =============================================================================

-- Test timestamp functions
SELECT 
    'Current UTC Time' as description,
    NOW() as timestamp;

SELECT 
    'Current IST Time' as description,
    now_ist() as timestamp;

SELECT 
    'Formatted IST Time' as description,
    format_ist_timestamp(NOW()) as timestamp;

-- Test table defaults
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name IN ('created_at', 'updated_at')
  AND column_default LIKE '%Asia/Kolkata%'
ORDER BY table_name, column_name;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show current timezone setting
SELECT 
    'Database Timezone' as setting,
    current_setting('TIMEZONE') as value;

-- Show all IST functions created
SELECT 
    'IST Functions Created' as info,
    routine_name
FROM information_schema.routines 
WHERE routine_name IN ('now_ist', 'to_ist', 'format_ist_timestamp')
ORDER BY routine_name;

-- Show tables with IST defaults
SELECT 
    'Tables with IST Defaults' as info,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name IN ('created_at', 'updated_at')
  AND column_default LIKE '%Asia/Kolkata%';

-- Display success message
SELECT 'SUCCESS: All database timestamps have been configured for IST (Asia/Kolkata timezone)!' as status;




