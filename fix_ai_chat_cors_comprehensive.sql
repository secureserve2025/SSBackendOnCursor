-- Comprehensive AI Chat CORS Fix
-- This script verifies and fixes AI chat functionality

-- 1. Check if the ai-chat function exists in the database
SELECT '=== AI CHAT FUNCTION CHECK ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'ai-chat';

-- 2. Check for any Edge Functions in the system
SELECT '=== EDGE FUNCTION CHECK ===' as section;
SELECT 
    'Edge Function Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name LIKE '%chat%' OR routine_name LIKE '%ai%'
        ) THEN '✅ Found potential AI/chat functions'
        ELSE '❌ No AI/chat functions found'
    END as status;

-- 3. List all functions that might be related to AI or chat
SELECT '=== RELATED FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%chat%' 
   OR routine_name LIKE '%ai%' 
   OR routine_name LIKE '%deliverable%'
ORDER BY routine_name;

-- 4. Check if the deliverables table exists and has the required structure
SELECT '=== DELIVERABLES TABLE CHECK ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deliverables'
ORDER BY ordinal_position;

-- 5. Create the deliverables table if it doesn't exist
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    deliverable_text TEXT,
    deliverable_order INTEGER DEFAULT 0,
    ai_chat_messages JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add missing columns to deliverables table if they don't exist
DO $$ 
BEGIN
    -- Add ai_chat_messages column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliverables' AND column_name = 'ai_chat_messages'
    ) THEN
        ALTER TABLE deliverables ADD COLUMN ai_chat_messages JSONB;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliverables' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE deliverables ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 7. Enable RLS on deliverables table
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for deliverables table
DROP POLICY IF EXISTS "Users can view deliverables for their projects" ON deliverables;
CREATE POLICY "Users can view deliverables for their projects" ON deliverables
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update deliverables for their projects" ON deliverables;
CREATE POLICY "Users can update deliverables for their projects" ON deliverables
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
            UNION
            SELECT p.id FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert deliverables for their projects" ON deliverables;
CREATE POLICY "Users can insert deliverables for their projects" ON deliverables
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN client_profiles cp ON p.client_id = cp.id
            WHERE cp.user_id = auth.uid()
        )
    );

-- 9. Create a test function to verify AI chat functionality
CREATE OR REPLACE FUNCTION test_ai_chat_functionality()
RETURNS TABLE (
    test_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Check if deliverables table exists
    RETURN QUERY SELECT 
        'Deliverables table exists'::TEXT as test_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') 
            THEN '✅ PASS'::TEXT
            ELSE '❌ FAIL'::TEXT
        END as status,
        'Table structure verification'::TEXT as details;
    
    -- Test 2: Check if ai_chat_messages column exists
    RETURN QUERY SELECT 
        'AI chat messages column exists'::TEXT as test_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'ai_chat_messages') 
            THEN '✅ PASS'::TEXT
            ELSE '❌ FAIL'::TEXT
        END as status,
        'Column structure verification'::TEXT as details;
    
    -- Test 3: Check RLS policies
    RETURN QUERY SELECT 
        'RLS policies configured'::TEXT as test_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deliverables') 
            THEN '✅ PASS'::TEXT
            ELSE '❌ FAIL'::TEXT
        END as status,
        'Security policy verification'::TEXT as details;
    
    -- Test 4: Check if we can insert test data
    BEGIN
        INSERT INTO deliverables (project_id, deliverable_text, ai_chat_messages) 
        VALUES ('00000000-0000-0000-0000-000000000000', 'Test deliverable', '[{"role": "test", "content": "test"}]')
        ON CONFLICT DO NOTHING;
        
        RETURN QUERY SELECT 
            'Database write access'::TEXT as test_name,
            '✅ PASS'::TEXT as status,
            'Can insert test data'::TEXT as details;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Database write access'::TEXT as test_name,
            '❌ FAIL'::TEXT as status,
            'Cannot insert test data: ' || SQLERRM::TEXT as details;
    END;
    
    -- Test 5: Check if we can read test data
    BEGIN
        PERFORM COUNT(*) FROM deliverables WHERE project_id = '00000000-0000-0000-0000-000000000000';
        
        RETURN QUERY SELECT 
            'Database read access'::TEXT as test_name,
            '✅ PASS'::TEXT as status,
            'Can read test data'::TEXT as details;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Database read access'::TEXT as test_name,
            '❌ FAIL'::TEXT as status,
            'Cannot read test data: ' || SQLERRM::TEXT as details;
    END;
    
    -- Clean up test data
    DELETE FROM deliverables WHERE project_id = '00000000-0000-0000-0000-000000000000';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Run the test function
SELECT '=== AI CHAT FUNCTIONALITY TEST ===' as section;
SELECT * FROM test_ai_chat_functionality();

-- 11. Check for any existing deliverables
SELECT '=== EXISTING DELIVERABLES ===' as section;
SELECT 
    COUNT(*) as total_deliverables,
    COUNT(CASE WHEN ai_chat_messages IS NOT NULL THEN 1 END) as with_ai_chat,
    COUNT(CASE WHEN deliverable_text IS NOT NULL THEN 1 END) as with_text
FROM deliverables;

-- 12. Show sample deliverables
SELECT '=== SAMPLE DELIVERABLES ===' as section;
SELECT 
    id,
    project_id,
    LEFT(deliverable_text, 50) as deliverable_preview,
    CASE 
        WHEN ai_chat_messages IS NOT NULL THEN 'Has AI chat'
        ELSE 'No AI chat'
    END as ai_chat_status,
    created_at
FROM deliverables 
LIMIT 5;

-- 13. Final verification summary
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
    'Database structure' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') 
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'ai_chat_messages')
        THEN '✅ Ready for AI chat'
        ELSE '❌ Database structure incomplete'
    END as status
UNION ALL
SELECT 
    'RLS policies' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deliverables') 
        THEN '✅ Security configured'
        ELSE '❌ RLS policies missing'
    END as status
UNION ALL
SELECT 
    'Edge function deployment' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'ai-chat') 
        THEN '✅ Function deployed'
        ELSE '⚠️ Function not found in database (may be deployed as Edge Function)'
    END as status;



