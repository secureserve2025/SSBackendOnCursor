-- Fix Escrow Funding Issue
-- This script addresses the "Could not find a relationship between 'projects' and 'client_profiles'" error

-- 1. Check current projects table structure
SELECT '=== CURRENT PROJECTS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Check foreign key relationships
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='projects';

-- 3. Add missing columns to projects table if they don't exist
DO $$ 
BEGIN
    -- Add project_status_workflow column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_status_workflow VARCHAR(100) DEFAULT 'Project Created';
    END IF;
    
    -- Add project_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_id VARCHAR(20) UNIQUE;
    END IF;
    
    -- Add sent_to_freelancer column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'sent_to_freelancer'
    ) THEN
        ALTER TABLE projects ADD COLUMN sent_to_freelancer BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. Create the missing RPC function for client projects display
CREATE OR REPLACE FUNCTION get_client_projects_display(client_uuid UUID)
RETURNS TABLE (
    id UUID,
    project_id VARCHAR(20),
    project_name VARCHAR(255),
    freelancer_id VARCHAR(20),
    freelancer_name VARCHAR(255),
    project_status_workflow VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_id,
        p.project_name,
        fp.freelancer_id,
        fp.full_name as freelancer_name,
        p.project_status_workflow,
        p.created_at
    FROM projects p
    LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
    WHERE p.client_id = client_uuid
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_projects_display(UUID) TO authenticated;

-- 6. Create function to get projects for escrow funding
CREATE OR REPLACE FUNCTION get_client_projects_for_escrow(client_user_id UUID)
RETURNS TABLE (
    id UUID,
    project_id VARCHAR(20),
    project_name VARCHAR(255),
    freelancer_id VARCHAR(20),
    freelancer_name VARCHAR(255),
    project_status_workflow VARCHAR(100),
    transaction_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_id,
        p.project_name,
        fp.freelancer_id,
        fp.full_name as freelancer_name,
        p.project_status_workflow,
        COALESCE(t.transaction_value, 0) as transaction_value,
        p.created_at
    FROM projects p
    LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
    LEFT JOIN transactions t ON p.id = t.project_id
    WHERE p.client_id = (
        SELECT id FROM client_profiles WHERE user_id = client_user_id
    )
    AND p.project_status_workflow = 'Checklist Signed off'
    AND NOT EXISTS (
        SELECT 1 FROM transactions t2 
        WHERE t2.project_id = p.id 
        AND t2.transaction_status = 'Fund Secured'
    )
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_projects_for_escrow(UUID) TO authenticated;

-- 8. Create function to get client profile by user ID
CREATE OR REPLACE FUNCTION get_client_profile_by_user_id(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    client_id VARCHAR(20),
    full_name VARCHAR(255),
    email VARCHAR(255),
    mobile_number VARCHAR(20),
    country_code VARCHAR(5),
    company_name VARCHAR(255),
    business_type VARCHAR(50),
    pan_tan_number VARCHAR(20),
    upi_id VARCHAR(100),
    profile_completed BOOLEAN,
    profile_verified BOOLEAN,
    account_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.client_id,
        cp.full_name,
        cp.email,
        cp.mobile_number,
        cp.country_code,
        cp.company_name,
        cp.business_type,
        cp.pan_tan_number,
        cp.upi_id,
        cp.profile_completed,
        cp.profile_verified,
        cp.account_status,
        cp.created_at,
        cp.updated_at
    FROM client_profiles cp
    WHERE cp.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_profile_by_user_id(UUID) TO authenticated;

-- 10. Check if there are any projects with the correct status
SELECT '=== PROJECTS WITH CHECKLIST SIGNED OFF STATUS ===' as section;
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_status_workflow,
    cp.client_id as client_profile_id,
    cp.full_name as client_name
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.project_status_workflow = 'Checklist Signed off'
ORDER BY p.created_at DESC;

-- 11. Check transactions for these projects
SELECT '=== TRANSACTIONS FOR CHECKLIST SIGNED OFF PROJECTS ===' as section;
SELECT 
    t.id,
    t.project_id,
    t.transaction_value,
    t.transaction_status,
    p.project_name,
    p.project_status_workflow
FROM transactions t
JOIN projects p ON t.project_id = p.id
WHERE p.project_status_workflow = 'Checklist Signed off'
ORDER BY t.created_at DESC;

-- 12. Test the new functions
SELECT '=== TESTING NEW FUNCTIONS ===' as section;

-- Test get_client_profile_by_user_id function
SELECT 'Testing get_client_profile_by_user_id:' as test_type;
SELECT * FROM get_client_profile_by_user_id('df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID);

-- Test get_client_projects_for_escrow function
SELECT 'Testing get_client_projects_for_escrow:' as test_type;
SELECT * FROM get_client_projects_for_escrow('df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID);

-- 13. Update existing projects to have project_id if missing
UPDATE projects 
SET project_id = 'V' || LPAD(CAST(nextval('projects_id_seq') AS TEXT), 4, '0')
WHERE project_id IS NULL;

-- 14. Create sequence for project_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'projects_id_seq') THEN
        CREATE SEQUENCE projects_id_seq START 1001;
    END IF;
END $$;

-- 15. Create function to generate project IDs
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN 'V' || LPAD(CAST(nextval('projects_id_seq') AS TEXT), 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger to auto-assign project_id
CREATE OR REPLACE FUNCTION auto_assign_project_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NULL THEN
        NEW.project_id := generate_project_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_project_id ON projects;
CREATE TRIGGER trigger_auto_assign_project_id
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_project_id();

-- 17. Final verification
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
    'RPC functions created' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_client_projects_display') 
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_client_projects_for_escrow')
        THEN '✅ Functions ready'
        ELSE '❌ Functions missing'
    END as status
UNION ALL
SELECT 
    'Projects table structure' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_status_workflow') 
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_id')
        THEN '✅ Structure complete'
        ELSE '❌ Structure incomplete'
    END as status
UNION ALL
SELECT 
    'Foreign key relationships' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'projects' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%client_profiles%'
        ) 
        THEN '✅ Relationships configured'
        ELSE '❌ Relationships missing'
    END as status;



