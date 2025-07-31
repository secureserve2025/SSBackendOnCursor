-- Fix for generate_project_id function ambiguous column reference
-- This script updates the function to use a different parameter name

-- Drop the existing function and recreate it with a different parameter name
DROP FUNCTION IF EXISTS generate_project_id();

-- Recreate the function with a different parameter name to avoid conflicts
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_id INTEGER;
    new_project_id VARCHAR(10);
BEGIN
    -- Get the next available ID
    SELECT COALESCE(MAX(CAST(SUBSTRING(projects.project_id FROM 2) AS INTEGER)), 1000) + 1
    INTO next_id
    FROM projects
    WHERE projects.project_id LIKE 'V%';
    
    -- Format as V + 4-digit number
    new_project_id := 'V' || LPAD(next_id::TEXT, 4, '0');
    
    RETURN new_project_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT generate_project_id() as test_project_id; 