-- Safe Fix for Escrow Funding Issue
-- This script only creates missing RPC functions without altering table structures

-- 1. Create the missing RPC function for client projects display
-- This function works with existing table structure
CREATE OR REPLACE FUNCTION get_client_projects_display(client_uuid UUID)
RETURNS TABLE (
    id UUID,
    project_name VARCHAR(255),
    freelancer_id VARCHAR(20),
    freelancer_name VARCHAR(255),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_name,
        fp.freelancer_id,
        fp.full_name as freelancer_name,
        p.status,
        p.created_at
    FROM projects p
    LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
    WHERE p.client_id = client_uuid
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_projects_display(UUID) TO authenticated;

-- 3. Create function to get projects for escrow funding
-- This function works with existing table structure and handles both status fields
CREATE OR REPLACE FUNCTION get_client_projects_for_escrow(client_user_id UUID)
RETURNS TABLE (
    id UUID,
    project_name VARCHAR(255),
    freelancer_id VARCHAR(20),
    freelancer_name VARCHAR(255),
    status VARCHAR(20),
    transaction_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_name,
        fp.freelancer_id,
        fp.full_name as freelancer_name,
        p.status,
        COALESCE(t.amount, 0) as transaction_value,
        p.created_at
    FROM projects p
    LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
    LEFT JOIN transactions t ON p.id = t.project_id
    WHERE p.client_id = (
        SELECT id FROM client_profiles WHERE user_id = client_user_id
    )
    AND (
        -- Check both possible status fields
        p.status = 'Checklist Signed off'
        OR (
            EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'project_status_workflow'
            ) 
            AND p.project_status_workflow = 'Checklist Signed off'
        )
    )
    AND NOT EXISTS (
        SELECT 1 FROM transactions t2 
        WHERE t2.project_id = p.id 
        AND t2.status = 'Fund Secured'
    )
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_projects_for_escrow(UUID) TO authenticated;

-- 5. Create function to get client profile by user ID
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

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_profile_by_user_id(UUID) TO authenticated;

-- 7. Test the new functions
SELECT '=== TESTING NEW FUNCTIONS ===' as section;

-- Test get_client_profile_by_user_id function
SELECT 'Testing get_client_profile_by_user_id:' as test_type;
SELECT * FROM get_client_profile_by_user_id('df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID);

-- Test get_client_projects_for_escrow function
SELECT 'Testing get_client_projects_for_escrow:' as test_type;
SELECT * FROM get_client_projects_for_escrow('df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID);

-- 8. Check what projects exist for the test user
SELECT '=== PROJECTS FOR TEST USER ===' as section;
SELECT 
    p.id,
    p.project_name,
    p.status,
    cp.client_id as client_profile_id,
    cp.full_name as client_name,
    fp.freelancer_id,
    fp.full_name as freelancer_name
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
WHERE cp.user_id = 'df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID
ORDER BY p.created_at DESC;

-- 9. Check transactions for these projects
SELECT '=== TRANSACTIONS FOR TEST USER PROJECTS ===' as section;
SELECT 
    t.id,
    t.project_id,
    t.amount,
    t.status as transaction_status,
    p.project_name,
    p.status as project_status
FROM transactions t
JOIN projects p ON t.project_id = p.id
JOIN client_profiles cp ON p.client_id = cp.id
WHERE cp.user_id = 'df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID
ORDER BY t.created_at DESC;

-- 10. Final verification
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
    END as status
UNION ALL
SELECT 
    'Test user has projects' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = 'df139dfb-21c7-4dc5-a704-dfd3d58aedf6'::UUID
        ) 
        THEN '✅ User has projects'
        ELSE '❌ No projects found'
    END as status;



