-- Fix Client ID Display with RPC Function
-- This creates a safe RPC function to get client display IDs

-- Create RPC function to get client display ID
CREATE OR REPLACE FUNCTION get_client_display_id(client_uuid UUID)
RETURNS TABLE(
    client_display_id VARCHAR(20),
    client_name VARCHAR(255),
    client_email VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.client_id,
        cp.full_name,
        cp.email
    FROM client_profiles cp
    WHERE cp.id = client_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 
    'RPC Function Test' as test_type,
    client_display_id,
    client_name,
    client_email
FROM get_client_display_id('5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'::UUID);


