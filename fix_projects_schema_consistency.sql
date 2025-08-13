-- Fix Projects Table Schema Consistency
-- This script standardizes how projects table references client_id and freelancer_id
-- and ensures consistent foreign key relationships across the entire schema

-- =============================================================================
-- STEP 1: Analyze current projects table structure
-- =============================================================================

-- First, let's check what the current projects table structure looks like
DO $$
DECLARE
    table_exists BOOLEAN;
    columns_info TEXT;
BEGIN
    -- Check if projects table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Projects table exists. Checking structure...';
        
        -- Get column information
        SELECT string_agg(
            column_name || ' ' || data_type || 
            CASE WHEN character_maximum_length IS NOT NULL 
                 THEN '(' || character_maximum_length || ')' 
                 ELSE '' 
            END, ', '
        ) INTO columns_info
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects'
        AND column_name IN ('client_id', 'freelancer_id');
        
        RAISE NOTICE 'Current ID columns: %', columns_info;
    ELSE
        RAISE NOTICE 'Projects table does not exist yet.';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Drop existing projects table and related objects to recreate consistently
-- =============================================================================

-- Drop dependent objects first
DROP VIEW IF EXISTS project_summary CASCADE;
DROP TRIGGER IF EXISTS trigger_cleanup_project_files ON projects;
DROP TRIGGER IF EXISTS trigger_auto_assign_project_id ON projects;
DROP FUNCTION IF EXISTS cleanup_project_files() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_project_id() CASCADE;
DROP FUNCTION IF EXISTS get_project_with_details(UUID) CASCADE;

-- Drop related tables that depend on projects
DROP TABLE IF EXISTS work_products CASCADE;
DROP TABLE IF EXISTS project_files CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Drop the projects table
DROP TABLE IF EXISTS projects CASCADE;

-- =============================================================================
-- STEP 3: Create the standardized projects table
-- =============================================================================

-- Create projects table with consistent schema
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id VARCHAR(10) UNIQUE NOT NULL, -- Auto-generated V-prefixed ID (e.g., V1001)
    
    -- Foreign key references using the actual IDs, not UUIDs
    client_id VARCHAR(20) NOT NULL REFERENCES client_profiles(client_id) ON DELETE RESTRICT,
    freelancer_id VARCHAR(20) REFERENCES freelancer_profiles(freelancer_id) ON DELETE RESTRICT,
    
    -- Project details
    project_category VARCHAR(50) DEFAULT 'Video Production' NOT NULL,
    project_name VARCHAR(100) NOT NULL CHECK (LENGTH(project_name) >= 3 AND LENGTH(project_name) <= 100),
    project_requirement TEXT NOT NULL CHECK (LENGTH(project_requirement) <= 500),
    desired_completion_date DATE NOT NULL CHECK (desired_completion_date > CURRENT_DATE),
    
    -- Enhanced status tracking
    project_status VARCHAR(50) DEFAULT 'Draft' CHECK (
        project_status IN (
            'Draft', 'Active', 'Assigned', 'In Progress', 'Under Review', 
            'Completed', 'Cancelled', 'On Hold', 'Disputed'
        )
    ),
    project_status_workflow VARCHAR(50) DEFAULT 'Created',
    
    -- Additional fields for comprehensive project management
    budget DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    project_description TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- STEP 4: Create related tables with consistent foreign key references
-- =============================================================================

-- Create project_files table
CREATE TABLE project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'project-files',
    uploaded_by VARCHAR(20), -- Either client_id or freelancer_id
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deliverables table
CREATE TABLE deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    deliverable_text VARCHAR(200) NOT NULL CHECK (LENGTH(deliverable_text) <= 200),
    deliverable_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected')),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_products table (for freelancer uploads)
CREATE TABLE work_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id VARCHAR(20) NOT NULL REFERENCES freelancer_profiles(freelancer_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'work-products',
    description TEXT,
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Required')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated T-prefixed ID
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id VARCHAR(20) NOT NULL REFERENCES client_profiles(client_id) ON DELETE RESTRICT,
    freelancer_id VARCHAR(20) REFERENCES freelancer_profiles(freelancer_id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN ('payment', 'refund', 'fee', 'escrow_deposit', 'escrow_release', 'bonus')
    ),
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')
    ),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    gateway_transaction_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated M-prefixed ID
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id VARCHAR(20) NOT NULL, -- Either client_id or freelancer_id
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'freelancer')),
    receiver_id VARCHAR(20) NOT NULL, -- Either client_id or freelancer_id
    receiver_type VARCHAR(20) NOT NULL CHECK (receiver_type IN ('client', 'freelancer')),
    message_content TEXT NOT NULL CHECK (LENGTH(message_content) <= 1000),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'notification')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 5: Create indexes for optimal performance
-- =============================================================================

-- Projects table indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_projects_status ON projects(project_status);
CREATE INDEX idx_projects_workflow_status ON projects(project_status_workflow);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_completion_date ON projects(desired_completion_date);

-- Project files indexes
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX idx_project_files_created_at ON project_files(created_at);

-- Deliverables indexes
CREATE INDEX idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX idx_deliverables_order ON deliverables(project_id, deliverable_order);
CREATE INDEX idx_deliverables_status ON deliverables(status);

-- Work products indexes
CREATE INDEX idx_work_products_project_id ON work_products(project_id);
CREATE INDEX idx_work_products_freelancer_id ON work_products(freelancer_id);
CREATE INDEX idx_work_products_status ON work_products(status);
CREATE INDEX idx_work_products_uploaded_at ON work_products(uploaded_at);

-- Transactions indexes
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_client_id ON transactions(client_id);
CREATE INDEX idx_transactions_freelancer_id ON transactions(freelancer_id);
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Messages indexes
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_message_id ON messages(message_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- =============================================================================
-- STEP 6: Create auto-generation functions for IDs
-- =============================================================================

-- Function to generate project IDs
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_id INTEGER;
    project_id VARCHAR(10);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(project_id FROM 2) AS INTEGER)), 1000) + 1
    INTO next_id
    FROM projects
    WHERE project_id ~ '^V[0-9]+$';
    
    project_id := 'V' || LPAD(next_id::TEXT, 4, '0');
    RETURN project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate transaction IDs
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_id BIGINT;
    transaction_id VARCHAR(20);
BEGIN
    next_id := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 + FLOOR(RANDOM() * 1000)::BIGINT;
    transaction_id := 'T' || LPAD((next_id % 9999999999999)::TEXT, 13, '0');
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate message IDs
CREATE OR REPLACE FUNCTION generate_message_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_id BIGINT;
    message_id VARCHAR(20);
BEGIN
    next_id := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 + FLOOR(RANDOM() * 1000)::BIGINT;
    message_id := 'M' || LPAD((next_id % 9999999999999)::TEXT, 13, '0');
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 7: Create triggers for auto-generation and updates
-- =============================================================================

-- Auto-assign project_id trigger
CREATE OR REPLACE FUNCTION auto_assign_project_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NULL OR NEW.project_id = '' THEN
        NEW.project_id := generate_project_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_project_id
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_project_id();

-- Auto-assign transaction_id trigger
CREATE OR REPLACE FUNCTION auto_assign_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
        NEW.transaction_id := generate_transaction_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_transaction_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_transaction_id();

-- Auto-assign message_id trigger
CREATE OR REPLACE FUNCTION auto_assign_message_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.message_id IS NULL OR NEW.message_id = '' THEN
        NEW.message_id := generate_message_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_message_id
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_message_id();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_products_updated_at
    BEFORE UPDATE ON work_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 8: Enable Row Level Security (RLS)
-- =============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 9: Create RLS policies
-- =============================================================================

-- Projects RLS policies
CREATE POLICY "Users can view their projects" ON projects
    FOR SELECT USING (
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can create projects" ON projects
    FOR INSERT WITH CHECK (
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their projects" ON projects
    FOR UPDATE USING (
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    );

-- Project files RLS policies
CREATE POLICY "Users can view files for their projects" ON project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can upload files for their projects" ON project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        )
    );

-- Work products RLS policies
CREATE POLICY "Freelancers can manage their work products" ON work_products
    FOR ALL USING (
        freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can view work products for their projects" ON work_products
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        )
    );

-- Transactions RLS policies
CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can create transactions" ON transactions
    FOR INSERT WITH CHECK (
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Messages RLS policies
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id IN (
            SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            UNION
            SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
        OR receiver_id IN (
            SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            UNION
            SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id IN (
            SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
            UNION
            SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- STEP 10: Create validation and helper functions
-- =============================================================================

-- Function to validate client-freelancer assignment
CREATE OR REPLACE FUNCTION validate_project_assignment(
    p_client_id VARCHAR(20),
    p_freelancer_id VARCHAR(20)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if client exists
    IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE client_id = p_client_id) THEN
        RAISE EXCEPTION 'Client ID % does not exist', p_client_id;
    END IF;
    
    -- Check if freelancer exists (if provided)
    IF p_freelancer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_id = p_freelancer_id) THEN
        RAISE EXCEPTION 'Freelancer ID % does not exist', p_freelancer_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get project participants
CREATE OR REPLACE FUNCTION get_project_participants(project_uuid UUID)
RETURNS TABLE(
    client_info JSON,
    freelancer_info JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT row_to_json(cp.*) FROM client_profiles cp WHERE cp.client_id = p.client_id) as client_info,
        (SELECT row_to_json(fp.*) FROM freelancer_profiles fp WHERE fp.freelancer_id = p.freelancer_id) as freelancer_info
    FROM projects p
    WHERE p.id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Display success message
SELECT 'Projects schema consistency has been successfully implemented!' as status;
SELECT 'All tables now consistently reference client_id and freelancer_id fields' as info;

-- Show table structures
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'project_files', 'deliverables', 'work_products', 'transactions', 'messages')
AND column_name IN ('client_id', 'freelancer_id')
ORDER BY table_name, column_name;




