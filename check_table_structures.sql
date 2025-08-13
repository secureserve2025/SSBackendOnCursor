-- Check table structures to understand the data type mismatch
-- This will help us fix the UUID/VARCHAR casting issue

-- 1. Check verification_reports table structure
SELECT '=== VERIFICATION_REPORTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check projects table structure
SELECT '=== PROJECTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check client_profiles table structure
SELECT '=== CLIENT_PROFILES TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'client_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check freelancer_profiles table structure
SELECT '=== FREELANCER_PROFILES TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check foreign key relationships
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as info;
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'verification_reports';

-- 6. Sample data to see actual values
SELECT '=== SAMPLE DATA ===' as info;
SELECT 'Sample verification_reports:' as table_name;
SELECT id, project_id, report_title FROM verification_reports LIMIT 3;

SELECT 'Sample projects:' as table_name;
SELECT id, project_name, client_id, freelancer_id FROM projects LIMIT 3;
