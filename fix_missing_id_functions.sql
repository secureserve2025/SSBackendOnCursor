-- Fix Missing ID Generation Functions
-- The trigger function is calling functions that don't exist

-- 1. Create the missing client ID generation function
CREATE OR REPLACE FUNCTION safe_generate_client_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a client ID
        new_id := 'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        
        -- Check if it already exists
        IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE client_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        -- Prevent infinite loop
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique client ID after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the missing freelancer ID generation function
CREATE OR REPLACE FUNCTION safe_generate_freelancer_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a freelancer ID
        new_id := 'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        
        -- Check if it already exists
        IF NOT EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        -- Prevent infinite loop
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique freelancer ID after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Verify the functions were created
SELECT '=== FUNCTION CREATION VERIFICATION ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('safe_generate_client_id', 'safe_generate_freelancer_id')
AND routine_schema = 'public';

-- 4. Test the functions
SELECT '=== FUNCTION TEST ===' as section;
SELECT 
    'Client ID: ' || safe_generate_client_id() as client_id_test,
    'Freelancer ID: ' || safe_generate_freelancer_id() as freelancer_id_test;

-- 5. Test the trigger function now
SELECT '=== TRIGGER FUNCTION TEST ===' as section;
DO $$
DECLARE
    test_result TEXT;
BEGIN
    BEGIN
        -- Try to call the function directly
        PERFORM safe_handle_new_user_signup();
        RAISE NOTICE 'Trigger function called successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Trigger function error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;


