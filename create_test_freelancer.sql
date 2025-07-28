-- Create Test Freelancer Profile
-- This script creates a test freelancer profile with the specific ID F214000319

-- First, let's run the comprehensive fix to ensure proper setup
-- (This is the same as fix_freelancer_validation_complete.sql)

-- 1. Create tables if they don't exist
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

-- 2. Enable RLS
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Public can view freelancer_id for validation" ON freelancer_profiles;

-- 4. Create new policies that allow public read access
CREATE POLICY "Public can view freelancer_id for validation" ON freelancer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_freelancer_id ON freelancer_profiles(freelancer_id);

-- 6. Insert test freelancer profile
-- Note: We'll use a placeholder UUID for user_id since we don't have a real user
INSERT INTO freelancer_profiles (
  user_id,
  freelancer_id,
  full_name,
  email,
  mobile_number,
  profile_completed,
  profile_verified
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder UUID
  'F214000319',
  'Test Freelancer',
  'test.freelancer@example.com',
  '9876543210',
  true,
  true
) ON CONFLICT (freelancer_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  mobile_number = EXCLUDED.mobile_number,
  profile_completed = EXCLUDED.profile_completed,
  profile_verified = EXCLUDED.profile_verified;

-- 7. Verify the insertion
SELECT freelancer_id, full_name, email FROM freelancer_profiles WHERE freelancer_id = 'F214000319';

-- 8. Test the public access
-- This should return the test freelancer
SELECT freelancer_id, full_name FROM freelancer_profiles LIMIT 5; 