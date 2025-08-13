-- Create a simple test function
-- This will help us verify if the issue is with the function logic

-- Drop and recreate a very simple function
DROP FUNCTION IF EXISTS test_freelancer_lookup(VARCHAR);

CREATE OR REPLACE FUNCTION test_freelancer_lookup(check_freelancer_id VARCHAR)
RETURNS TABLE (
    found BOOLEAN,
    freelancer_id VARCHAR,
    full_name VARCHAR
) AS $$
DECLARE
    freelancer_record RECORD;
BEGIN
    -- Simple lookup
    SELECT * INTO freelancer_record
    FROM freelancer_profiles fp
    WHERE fp.freelancer_id = check_freelancer_id;
    
    -- Return result
    IF FOUND THEN
        RETURN QUERY SELECT 
            true,
            freelancer_record.freelancer_id,
            freelancer_record.full_name;
    ELSE
        RETURN QUERY SELECT 
            false,
            check_freelancer_id,
            ''::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the simple function
SELECT 'Testing simple function with F308208874:' as test_description;
SELECT * FROM test_freelancer_lookup('F308208874');

-- Test with non-existent ID
SELECT 'Testing simple function with F999999999:' as test_description;
SELECT * FROM test_freelancer_lookup('F999999999');
