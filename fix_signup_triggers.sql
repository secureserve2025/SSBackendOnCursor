-- Fix Signup Triggers for Automatic Profile Creation
-- This script ensures that profiles are automatically created when users sign up

-- 1. First, let's check if the triggers exist
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%auth_user%' OR trigger_name LIKE '%freelancer%' OR trigger_name LIKE '%client%';

-- 2. Check if the functions exist
SELECT 
  routine_name, 
  routine_type, 
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_freelancer', 'handle_new_client');

-- 3. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;

-- 4. Create or recreate the functions
CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO freelancer_profiles (user_id, freelancer_id, email, full_name)
  VALUES (
    NEW.id, 
    'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_client()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_profiles (user_id, client_id, email, full_name)
  VALUES (
    NEW.id, 
    'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the triggers
CREATE TRIGGER on_auth_user_created_freelancer
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.raw_user_meta_data->>'user_type' = 'freelancer')
  EXECUTE FUNCTION handle_new_freelancer();

CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.raw_user_meta_data->>'user_type' = 'client')
  EXECUTE FUNCTION handle_new_client();

-- 6. Verify the triggers were created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created_freelancer', 'on_auth_user_created_client');

-- 7. Test the functions manually (optional)
-- This simulates what happens when a user signs up
-- Uncomment these lines to test the functions:

-- Test freelancer function:
-- SELECT handle_new_freelancer();

-- Test client function:
-- SELECT handle_new_client();

-- 8. Check if there are any existing users without profiles
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  fp.freelancer_id,
  cp.client_id
FROM auth.users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
LEFT JOIN client_profiles cp ON u.id = cp.user_id
WHERE (u.raw_user_meta_data->>'user_type' = 'freelancer' AND fp.user_id IS NULL)
   OR (u.raw_user_meta_data->>'user_type' = 'client' AND cp.user_id IS NULL); 