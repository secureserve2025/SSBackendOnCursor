-- Test Profile System
-- Run this after setting up the tables to verify everything works

-- 1. Check if tables exist and have correct structure
SELECT '=== TABLE STRUCTURE CHECK ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('freelancer_profiles', 'client_profiles')
ORDER BY table_name, ordinal_position;

-- 2. Check RLS policies
SELECT '=== RLS POLICIES CHECK ===' as info;

SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('freelancer_profiles', 'client_profiles')
ORDER BY tablename, policyname;

-- 3. Check triggers
SELECT '=== TRIGGERS CHECK ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('freelancer_profiles', 'client_profiles')
ORDER BY trigger_name;

-- 4. Check functions
SELECT '=== FUNCTIONS CHECK ===' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_freelancer', 'handle_new_client', 'update_updated_at_column')
ORDER BY routine_name;

-- 5. Test data insertion (this will show if policies work)
SELECT '=== POLICY TEST ===' as info;

-- This should work if you're authenticated as a user
-- If not authenticated, this will show the RLS policy in action
SELECT 
    'freelancer_profiles' as table_name,
    COUNT(*) as record_count
FROM freelancer_profiles
UNION ALL
SELECT 
    'client_profiles' as table_name,
    COUNT(*) as record_count
FROM client_profiles;

-- 6. Check indexes
SELECT '=== INDEXES CHECK ===' as info;

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('freelancer_profiles', 'client_profiles')
ORDER BY tablename, indexname;

-- 7. Final status
SELECT '=== SYSTEM STATUS ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'freelancer_profiles') 
        THEN '✅ freelancer_profiles table exists'
        ELSE '❌ freelancer_profiles table missing'
    END as freelancer_table_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles') 
        THEN '✅ client_profiles table exists'
        ELSE '❌ client_profiles table missing'
    END as client_table_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_profiles') 
        THEN '✅ freelancer_profiles policies exist'
        ELSE '❌ freelancer_profiles policies missing'
    END as freelancer_policies_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_profiles') 
        THEN '✅ client_profiles policies exist'
        ELSE '❌ client_profiles policies missing'
    END as client_policies_status; 