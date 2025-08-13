-- Check if ai-chat function exists and is properly configured
-- Run this in Supabase SQL Editor

-- 1. Check if the function exists in the database
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'ai-chat';

-- 2. Check if the function is accessible
-- This will help identify if it's a deployment issue
SELECT 
    'Function Status Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'ai-chat'
        ) THEN '✅ Function exists in database'
        ELSE '❌ Function not found in database'
    END as status;

-- 3. Check for any Edge Functions in the system
SELECT 
    'Edge Function Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name LIKE '%chat%' OR routine_name LIKE '%ai%'
        ) THEN '✅ Found potential AI/chat functions'
        ELSE '❌ No AI/chat functions found'
    END as status;

-- 4. List all functions that might be related to AI or chat
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%chat%' 
   OR routine_name LIKE '%ai%' 
   OR routine_name LIKE '%deliverable%'
ORDER BY routine_name;
