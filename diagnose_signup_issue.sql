-- Diagnostic Script for Signup Issues
-- This script helps identify what's causing the "Database error saving new user" issue

-- 1. Check if the auth.users table is accessible
SELECT 'Auth users table accessible' as status 
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- 2. Check recent user signups
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'user_type' as user_type,
  email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if profiles exist for recent users
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  u.created_at,
  fp.freelancer_id,
  cp.client_id
FROM auth.users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
LEFT JOIN client_profiles cp ON u.id = cp.user_id
ORDER BY u.created_at DESC 
LIMIT 10;

-- 4. Check for users without profiles (this might be the issue)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  u.created_at
FROM auth.users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
LEFT JOIN client_profiles cp ON u.id = cp.user_id
WHERE (u.raw_user_meta_data->>'user_type' = 'freelancer' AND fp.user_id IS NULL)
   OR (u.raw_user_meta_data->>'user_type' = 'client' AND cp.user_id IS NULL)
   OR (u.raw_user_meta_data->>'user_type' IS NULL);

-- 5. Check if the triggers exist and are working
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created_freelancer', 'on_auth_user_created_client');

-- 6. Check if the functions exist
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_freelancer', 'handle_new_client');

-- 7. Check table permissions
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('freelancer_profiles', 'client_profiles', 'auth.users');

-- 8. Check for any recent errors in the database
-- (This might show in Supabase logs)
SELECT 'Check Supabase dashboard logs for recent errors' as note;

-- 9. Test if we can insert into profiles manually
-- This will help identify if it's a permissions issue
SELECT 'Manual insert test - check if this works:' as test_note;

-- Try to insert a test profile (this might fail if there are permission issues)
-- INSERT INTO freelancer_profiles (user_id, freelancer_id, email, full_name, mobile_number)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'F999999999', 'test@example.com', 'Test User', '1234567890')
-- ON CONFLICT (freelancer_id) DO NOTHING; 