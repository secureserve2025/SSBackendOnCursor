-- Apply Immutability Fixes via Supabase SQL Editor
-- Copy and paste this script into your Supabase SQL Editor
-- https://supabase.com/dashboard/project/[your-project]/sql

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
-- STEP 6: Update existing triggers for profile creation
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
-- STEP 7: Add indexes for performance (if they don't exist)
-- =============================================================================

-- Ensure indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id ON client_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_freelancer_id ON freelancer_profiles(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(email);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_email ON freelancer_profiles(email);

-- =============================================================================
-- STEP 8: Test the system
-- =============================================================================

-- Test client ID generation
SELECT 'Testing Client ID Generation:' as test_type, generate_client_id() as generated_id;

-- Test freelancer ID generation  
SELECT 'Testing Freelancer ID Generation:' as test_type, generate_freelancer_id() as generated_id;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check current status
SELECT 'Current client_profiles count' as info, COUNT(*) as count FROM client_profiles;
SELECT 'Current freelancer_profiles count' as info, COUNT(*) as count FROM freelancer_profiles;

-- Check if triggers were created successfully
SELECT 
    'Immutability Triggers Status' as check_type,
    trigger_name,
    event_object_table,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name IN (
    'prevent_client_id_modification',
    'prevent_freelancer_id_modification'
)
ORDER BY event_object_table;

-- Check if constraints were created successfully
SELECT 
    'Format Constraints Status' as check_type,
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_name IN (
    'check_client_id_format',
    'check_freelancer_id_format'
)
ORDER BY table_name;

-- Display success message
SELECT 'SUCCESS: Client ID and Freelancer ID immutability protection has been successfully implemented!' as status;




