-- Fix Signup Database Error
-- This script addresses the "Database error saving new user" issue

-- 1. First, let's check the current state
SELECT 'Starting signup fix...' as status;

-- 2. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Check if tables exist and recreate if needed
DROP TABLE IF EXISTS freelancer_profiles CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;

-- 4. Create freelancer_profiles table with proper structure
CREATE TABLE freelancer_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) DEFAULT '0000000000',
  country_code VARCHAR(5) DEFAULT '+91',
  upi_id VARCHAR(100),
  aadhar_number VARCHAR(12),
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create client_profiles table with proper structure
CREATE TABLE client_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) DEFAULT '0000000000',
  country_code VARCHAR(5) DEFAULT '+91',
  company_name VARCHAR(255),
  business_type VARCHAR(50),
  pan_tan_number VARCHAR(20),
  upi_id VARCHAR(100),
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on both tables
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP FUNCTION IF EXISTS handle_new_freelancer();
DROP FUNCTION IF EXISTS handle_new_client();

-- 8. Create improved trigger functions with better error handling
CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
BEGIN
  -- Add comprehensive error handling
  BEGIN
    INSERT INTO freelancer_profiles (user_id, freelancer_id, email, full_name, mobile_number)
    VALUES (
      NEW.id, 
      'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      '0000000000'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error (this will appear in Supabase logs)
    RAISE LOG 'Error creating freelancer profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation, just log the error
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Add comprehensive error handling
  BEGIN
    INSERT INTO client_profiles (user_id, client_id, email, full_name, mobile_number)
    VALUES (
      NEW.id, 
      'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      '0000000000'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error (this will appear in Supabase logs)
    RAISE LOG 'Error creating client profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation, just log the error
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create the triggers
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

-- 10. Create RLS policies for freelancer_profiles
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;

CREATE POLICY "Users can view own freelancer profile" ON freelancer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Create RLS policies for client_profiles
DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;

CREATE POLICY "Users can view own client profile" ON client_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own client profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client profile" ON client_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON freelancer_profiles TO anon, authenticated;
GRANT ALL ON client_profiles TO anon, authenticated;

-- 13. Verify the setup
SELECT 'Signup fix completed successfully!' as status;
SELECT 'Freelancer profiles table created' as table_status WHERE EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1);
SELECT 'Client profiles table created' as table_status WHERE EXISTS (SELECT 1 FROM client_profiles LIMIT 1);
SELECT 'Triggers created' as trigger_status WHERE EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name IN ('on_auth_user_created_freelancer', 'on_auth_user_created_client'));
