-- Diagnostic Script for Freelancer ID Validation Issue
-- Run this to check what's happening with the freelancer_profiles table

-- 1. Check if the table exists
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE tablename = 'freelancer_profiles';

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'freelancer_profiles';

-- 4. Check existing policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 5. Check if there are any records in the table
SELECT COUNT(*) as total_records FROM freelancer_profiles;

-- 6. List all freelancer IDs (if any exist)
SELECT freelancer_id, full_name, email FROM freelancer_profiles LIMIT 10;

-- 7. Test specific freelancer ID lookup
SELECT freelancer_id, full_name, email 
FROM freelancer_profiles 
WHERE freelancer_id = 'F214000319';

-- 8. Check for any constraints that might be blocking
SELECT 
  conname, 
  contype, 
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'freelancer_profiles'::regclass;

-- 9. Check if the table is accessible (this should work if RLS is properly configured)
-- If this fails, it means RLS is blocking access
SELECT 'Table is accessible' as status 
WHERE EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1); 