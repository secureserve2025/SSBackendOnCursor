-- Comprehensive Fix for Freelancer ID Validation
-- This script ensures the database is properly configured for freelancer ID validation

-- 1. First, let's check if the tables exist and create them if needed
CREATE TABLE IF NOT EXISTS freelancer_profiles (
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

CREATE TABLE IF NOT EXISTS client_profiles (
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

-- 2. Enable RLS
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Public can view freelancer_id for validation" ON freelancer_profiles;

DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Public can view client_id for validation" ON client_profiles;

-- 4. Create new policies that allow public read access for validation
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_freelancer_id ON freelancer_profiles(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id ON client_profiles(client_id);

-- 6. Test queries to verify everything works
-- Uncomment these lines to test after running the script:

-- Test 1: Check if we can read from freelancer_profiles
-- SELECT COUNT(*) FROM freelancer_profiles;

-- Test 2: Check existing freelancer IDs
-- SELECT freelancer_id, full_name FROM freelancer_profiles LIMIT 5;

-- Test 3: Test specific freelancer ID lookup
-- SELECT freelancer_id, full_name FROM freelancer_profiles WHERE freelancer_id = 'F214000319';

-- Test 4: Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'freelancer_profiles'; 