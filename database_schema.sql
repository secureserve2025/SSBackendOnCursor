-- Database Schema for SecureServe Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Freelancer Profiles Table
CREATE TABLE freelancer_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id VARCHAR(20) UNIQUE NOT NULL, -- System generated ID (e.g., F123456789)
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

-- Client Profiles Table
CREATE TABLE client_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(20) UNIQUE NOT NULL, -- System generated ID (e.g., C123456789)
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

-- Projects Table (Enhanced)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  budget DECIMAL(10,2),
  client_id UUID REFERENCES client_profiles(id),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'disputed')),
  completion_date DATE,
  deliverables JSONB, -- Store deliverables as JSON array
  project_files JSONB, -- Store file information as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table (Enhanced)
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('payment', 'refund', 'fee', 'escrow_release')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- Can be either client or freelancer ID
  sender_type VARCHAR(20) CHECK (sender_type IN ('client', 'freelancer')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Freelancer Profiles
CREATE POLICY "Users can view own freelancer profile" ON freelancer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Client Profiles
CREATE POLICY "Users can view own client profile" ON client_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own client profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client profile" ON client_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Projects
CREATE POLICY "Users can view projects they're involved in" ON projects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM client_profiles WHERE id = projects.client_id
      UNION
      SELECT user_id FROM freelancer_profiles WHERE id = projects.freelancer_id
    )
  );

CREATE POLICY "Clients can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM client_profiles WHERE id = projects.client_id)
  );

CREATE POLICY "Users can update projects they own" ON projects
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM client_profiles WHERE id = projects.client_id
      UNION
      SELECT user_id FROM freelancer_profiles WHERE id = projects.freelancer_id
    )
  );

-- RLS Policies for Transactions
CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT cp.user_id FROM client_profiles cp 
      JOIN projects p ON p.client_id = cp.id 
      WHERE p.id = transactions.project_id
      UNION
      SELECT fp.user_id FROM freelancer_profiles fp 
      JOIN projects p ON p.freelancer_id = fp.id 
      WHERE p.id = transactions.project_id
    )
  );

CREATE POLICY "Users can create transactions for their projects" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT cp.user_id FROM client_profiles cp 
      JOIN projects p ON p.client_id = cp.id 
      WHERE p.id = transactions.project_id
      UNION
      SELECT fp.user_id FROM freelancer_profiles fp 
      JOIN projects p ON p.freelancer_id = fp.id 
      WHERE p.id = transactions.project_id
    )
  );

-- RLS Policies for Messages
CREATE POLICY "Users can view project messages" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT cp.user_id FROM client_profiles cp 
      JOIN projects p ON p.client_id = cp.id 
      WHERE p.id = messages.project_id
      UNION
      SELECT fp.user_id FROM freelancer_profiles fp 
      JOIN projects p ON p.freelancer_id = fp.id 
      WHERE p.id = messages.project_id
    )
  );

CREATE POLICY "Users can send messages to their projects" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT cp.user_id FROM client_profiles cp 
      JOIN projects p ON p.client_id = cp.id 
      WHERE p.id = messages.project_id
      UNION
      SELECT fp.user_id FROM freelancer_profiles fp 
      JOIN projects p ON p.freelancer_id = fp.id 
      WHERE p.id = messages.project_id
    )
  );

-- Functions for automatic profile creation
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

-- Triggers for automatic profile creation
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_freelancer_profiles_updated_at
  BEFORE UPDATE ON freelancer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
CREATE INDEX idx_freelancer_profiles_freelancer_id ON freelancer_profiles(freelancer_id);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_client_id ON client_profiles(client_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_created_at ON messages(created_at); 