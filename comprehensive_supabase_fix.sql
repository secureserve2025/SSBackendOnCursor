-- Comprehensive Supabase Configuration Fix
-- This script fixes all potential issues with signup, triggers, and RLS policies

-- 1. First, let's check the current state
SELECT 'Starting comprehensive fix...' as status;

-- 2. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Drop and recreate tables with proper structure
DROP TABLE IF EXISTS freelancer_profiles CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;

CREATE TABLE freelancer_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) DEFAULT '+91',
  upi_id VARCHAR(100),
  aadhar_number VARCHAR(12),
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
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

-- 4. Enable RLS
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop all existing policies
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Public can view freelancer_id for validation" ON freelancer_profiles;

DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Public can view client_id for validation" ON client_profiles;

-- 6. Create new policies that allow public read access for validation
CREATE POLICY "Public can view freelancer_id for validation" ON freelancer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view client_id for validation" ON client_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own client profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client profile" ON client_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Create indexes
CREATE INDEX idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
CREATE INDEX idx_freelancer_profiles_freelancer_id ON freelancer_profiles(freelancer_id);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_client_id ON client_profiles(client_id);

-- 8. Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP FUNCTION IF EXISTS handle_new_freelancer();
DROP FUNCTION IF EXISTS handle_new_client();

-- 9. Create improved trigger functions with better error handling
CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
BEGIN
  -- Add error handling
  BEGIN
    INSERT INTO freelancer_profiles (user_id, freelancer_id, email, full_name, mobile_number)
    VALUES (
      NEW.id, 
      'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      '0000000000' -- Default mobile number
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
  -- Add error handling
  BEGIN
    INSERT INTO client_profiles (user_id, client_id, email, full_name, mobile_number)
    VALUES (
      NEW.id, 
      'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      '0000000000' -- Default mobile number
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error (this will appear in Supabase logs)
    RAISE LOG 'Error creating client profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation, just log the error
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create the triggers
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

-- 11. Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create update triggers
CREATE TRIGGER update_freelancer_profiles_updated_at
  BEFORE UPDATE ON freelancer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Verify everything is set up correctly
SELECT 'Configuration complete. Verifying setup...' as status;

-- 14. Verify triggers and functions exist (without calling them)
SELECT 
  'Setup complete. Triggers and policies configured.' as status,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name IN ('on_auth_user_created_freelancer', 'on_auth_user_created_client')) as trigger_count,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('handle_new_freelancer', 'handle_new_client')) as function_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('freelancer_profiles', 'client_profiles')) as table_count;

-- 15. Test table access
SELECT 
  'Table access test:' as test_type,
  (SELECT COUNT(*) FROM freelancer_profiles) as freelancer_profiles_count,
  (SELECT COUNT(*) FROM client_profiles) as client_profiles_count; 