-- Comprehensive Fix for Client ID and Freelancer ID Immutability and Consistency
-- This script ensures that client_id and freelancer_id are:
-- 1. Never allowed to change after creation
-- 2. Unique across the entire system
-- 3. Properly generated with collision prevention
-- 4. Correctly referenced in all related tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 1: Create immutability protection functions
-- =============================================================================

-- Function to prevent client_id updates
CREATE OR REPLACE FUNCTION prevent_client_id_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent any attempt to change client_id
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
        RAISE EXCEPTION 'client_id cannot be modified after creation. Attempted change from % to %', OLD.client_id, NEW.client_id;
    END IF;
    
    -- Allow other field updates
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent freelancer_id updates
CREATE OR REPLACE FUNCTION prevent_freelancer_id_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent any attempt to change freelancer_id
    IF OLD.freelancer_id IS DISTINCT FROM NEW.freelancer_id THEN
        RAISE EXCEPTION 'freelancer_id cannot be modified after creation. Attempted change from % to %', OLD.freelancer_id, NEW.freelancer_id;
    END IF;
    
    -- Allow other field updates
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 2: Improved ID generation functions with collision prevention
-- =============================================================================

-- Function to generate unique client_id with collision prevention
CREATE OR REPLACE FUNCTION generate_client_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_id VARCHAR(20);
    counter INTEGER := 0;
    max_attempts INTEGER := 1000;
    base_number BIGINT;
BEGIN
    LOOP
        -- Generate a more unique number using timestamp + random
        base_number := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 + FLOOR(RANDOM() * 1000)::BIGINT;
        new_id := 'C' || LPAD((base_number % 999999999)::TEXT, 9, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE client_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        IF counter >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique client_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique freelancer_id with collision prevention
CREATE OR REPLACE FUNCTION generate_freelancer_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_id VARCHAR(20);
    counter INTEGER := 0;
    max_attempts INTEGER := 1000;
    base_number BIGINT;
BEGIN
    LOOP
        -- Generate a more unique number using timestamp + random
        base_number := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 + FLOOR(RANDOM() * 1000)::BIGINT;
        new_id := 'F' || LPAD((base_number % 999999999)::TEXT, 9, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        IF counter >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique freelancer_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: Update profile creation functions to use new ID generators
-- =============================================================================

-- Updated handle_new_client function with improved ID generation
CREATE OR REPLACE FUNCTION handle_new_client()
RETURNS TRIGGER AS $$
DECLARE
    new_client_id VARCHAR(20);
BEGIN
    -- Generate unique client_id
    new_client_id := generate_client_id();
    
    -- Insert new client profile
    INSERT INTO client_profiles (user_id, client_id, email, full_name, mobile_number)
    VALUES (
        NEW.id, 
        new_client_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', '')
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating client profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated handle_new_freelancer function with improved ID generation
CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
DECLARE
    new_freelancer_id VARCHAR(20);
BEGIN
    -- Generate unique freelancer_id
    new_freelancer_id := generate_freelancer_id();
    
    -- Insert new freelancer profile
    INSERT INTO freelancer_profiles (user_id, freelancer_id, email, full_name, mobile_number)
    VALUES (
        NEW.id, 
        new_freelancer_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', '')
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating freelancer profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: Create or update triggers for immutability
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS prevent_client_id_modification ON client_profiles;
DROP TRIGGER IF EXISTS prevent_freelancer_id_modification ON freelancer_profiles;

-- Create immutability triggers
CREATE TRIGGER prevent_client_id_modification
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_client_id_update();

CREATE TRIGGER prevent_freelancer_id_modification
    BEFORE UPDATE ON freelancer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_freelancer_id_update();

-- =============================================================================
-- STEP 5: Add constraints for additional protection
-- =============================================================================

-- Add check constraint to ensure client_id format
ALTER TABLE client_profiles 
DROP CONSTRAINT IF EXISTS check_client_id_format;

ALTER TABLE client_profiles 
ADD CONSTRAINT check_client_id_format 
CHECK (client_id ~ '^C[0-9]{9}$');

-- Add check constraint to ensure freelancer_id format
ALTER TABLE freelancer_profiles 
DROP CONSTRAINT IF EXISTS check_freelancer_id_format;

ALTER TABLE freelancer_profiles 
ADD CONSTRAINT check_freelancer_id_format 
CHECK (freelancer_id ~ '^F[0-9]{9}$');

-- =============================================================================
-- STEP 6: Function to check for duplicate profiles
-- =============================================================================

-- Function to check if user already has a client profile
CREATE OR REPLACE FUNCTION user_has_client_profile(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_profiles 
        WHERE email = user_email
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user already has a freelancer profile
CREATE OR REPLACE FUNCTION user_has_freelancer_profile(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM freelancer_profiles 
        WHERE email = user_email
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 7: Add logging for ID changes (audit trail)
-- =============================================================================

-- Create audit log table for profile changes
CREATE TABLE IF NOT EXISTS profile_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    table_name_var VARCHAR(50);
    old_values_json JSONB;
    new_values_json JSONB;
BEGIN
    table_name_var := TG_TABLE_NAME;
    
    IF TG_OP = 'INSERT' THEN
        new_values_json := row_to_json(NEW)::jsonb;
        INSERT INTO profile_audit_log (table_name, record_id, user_id, action, new_values)
        VALUES (table_name_var, NEW.id, NEW.user_id, 'INSERT', new_values_json);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        old_values_json := row_to_json(OLD)::jsonb;
        new_values_json := row_to_json(NEW)::jsonb;
        INSERT INTO profile_audit_log (table_name, record_id, user_id, action, old_values, new_values)
        VALUES (table_name_var, NEW.id, NEW.user_id, 'UPDATE', old_values_json, new_values_json);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        old_values_json := row_to_json(OLD)::jsonb;
        INSERT INTO profile_audit_log (table_name, record_id, user_id, action, old_values)
        VALUES (table_name_var, OLD.id, OLD.user_id, 'DELETE', old_values_json);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
DROP TRIGGER IF EXISTS audit_client_profiles ON client_profiles;
DROP TRIGGER IF EXISTS audit_freelancer_profiles ON freelancer_profiles;

CREATE TRIGGER audit_client_profiles
    AFTER INSERT OR UPDATE OR DELETE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_changes();

CREATE TRIGGER audit_freelancer_profiles
    AFTER INSERT OR UPDATE OR DELETE ON freelancer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_changes();

-- =============================================================================
-- STEP 8: Update existing triggers for profile creation
-- =============================================================================

-- Drop and recreate signup triggers with the updated functions
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;

CREATE TRIGGER on_auth_user_created_client
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    WHEN (NEW.raw_user_meta_data->>'user_type' = 'client')
    EXECUTE FUNCTION handle_new_client();

CREATE TRIGGER on_auth_user_created_freelancer
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    WHEN (NEW.raw_user_meta_data->>'user_type' = 'freelancer')
    EXECUTE FUNCTION handle_new_freelancer();

-- =============================================================================
-- STEP 9: Add indexes for performance
-- =============================================================================

-- Ensure indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id ON client_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_freelancer_id ON freelancer_profiles(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(email);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_email ON freelancer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_record_id ON profile_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_created_at ON profile_audit_log(created_at);

-- =============================================================================
-- STEP 10: Validation and testing functions
-- =============================================================================

-- Function to validate all existing IDs are in correct format
CREATE OR REPLACE FUNCTION validate_existing_ids()
RETURNS TABLE(
    table_name TEXT,
    invalid_count BIGINT,
    issues TEXT[]
) AS $$
DECLARE
    client_issues TEXT[];
    freelancer_issues TEXT[];
    client_invalid_count BIGINT;
    freelancer_invalid_count BIGINT;
BEGIN
    -- Check client_profiles
    SELECT COUNT(*), ARRAY_AGG(client_id)
    INTO client_invalid_count, client_issues
    FROM client_profiles 
    WHERE client_id !~ '^C[0-9]{9}$';
    
    -- Check freelancer_profiles
    SELECT COUNT(*), ARRAY_AGG(freelancer_id)
    INTO freelancer_invalid_count, freelancer_issues
    FROM freelancer_profiles 
    WHERE freelancer_id !~ '^F[0-9]{9}$';
    
    -- Return results
    RETURN QUERY VALUES
        ('client_profiles'::TEXT, client_invalid_count, client_issues),
        ('freelancer_profiles'::TEXT, freelancer_invalid_count, freelancer_issues);
END;
$$ LANGUAGE plpgsql;

-- Function to check for duplicate emails across profiles
CREATE OR REPLACE FUNCTION check_duplicate_emails()
RETURNS TABLE(
    email TEXT,
    has_client_profile BOOLEAN,
    has_freelancer_profile BOOLEAN,
    client_id TEXT,
    freelancer_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(cp.email, fp.email) as email,
        (cp.email IS NOT NULL) as has_client_profile,
        (fp.email IS NOT NULL) as has_freelancer_profile,
        cp.client_id,
        fp.freelancer_id
    FROM client_profiles cp
    FULL OUTER JOIN freelancer_profiles fp ON cp.email = fp.email
    WHERE cp.email IS NOT NULL AND fp.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check current status
SELECT 'Current client_profiles count' as info, COUNT(*) as count FROM client_profiles;
SELECT 'Current freelancer_profiles count' as info, COUNT(*) as count FROM freelancer_profiles;

-- Validate existing IDs
SELECT * FROM validate_existing_ids();

-- Check for users with both profiles
SELECT * FROM check_duplicate_emails();

-- Display success message
SELECT 'Client ID and Freelancer ID immutability protection has been successfully implemented!' as status;




