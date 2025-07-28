-- Test Supabase Connection and Basic Functionality
-- This script tests if the basic Supabase setup is working

-- 1. Test if we can access the auth.users table
SELECT 'Auth users table accessible' as test_result
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- 2. Test if we can access the freelancer_profiles table
SELECT 'Freelancer profiles table accessible' as test_result
WHERE EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1);

-- 3. Test if we can access the client_profiles table
SELECT 'Client profiles table accessible' as test_result
WHERE EXISTS (SELECT 1 FROM client_profiles LIMIT 1);

-- 4. Check if there are any existing users
SELECT 
  COUNT(*) as user_count,
  COUNT(CASE WHEN raw_user_meta_data->>'user_type' = 'freelancer' THEN 1 END) as freelancer_count,
  COUNT(CASE WHEN raw_user_meta_data->>'user_type' = 'client' THEN 1 END) as client_count
FROM auth.users;

-- 5. Check if there are any existing profiles
SELECT 
  (SELECT COUNT(*) FROM freelancer_profiles) as freelancer_profile_count,
  (SELECT COUNT(*) FROM client_profiles) as client_profile_count;

-- 6. Test if the trigger functions can be called manually
SELECT 'Testing trigger functions...' as test_note;

-- This should return a result (even if it's an error, it means the function exists)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_freelancer') 
    THEN 'handle_new_freelancer function exists'
    ELSE 'handle_new_freelancer function missing'
  END as freelancer_function_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_client') 
    THEN 'handle_new_client function exists'
    ELSE 'handle_new_client function missing'
  END as client_function_status;

-- 7. Check RLS policies
SELECT 
  table_name,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE table_name IN ('freelancer_profiles', 'client_profiles')
ORDER BY table_name, policyname;

-- 8. Final connection test
SELECT 'Supabase connection test complete' as final_status; 