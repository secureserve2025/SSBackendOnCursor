-- Fix Messages Table - Create a custom messages table to avoid conflicts with Supabase realtime
-- This script creates a project_messages table with the correct structure

-- Drop the existing project_messages table if it exists (this will also drop any data)
DROP TABLE IF EXISTS project_messages CASCADE;

-- Create the project_messages table with the correct structure
CREATE TABLE project_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- Can be either client or freelancer ID
  sender_type VARCHAR(20) CHECK (sender_type IN ('client', 'freelancer')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Messages - Basic version without complex joins
-- Users can view messages for projects they're involved in
CREATE POLICY "Users can view project messages" ON project_messages
  FOR SELECT USING (true); -- Allow all reads for now, we'll filter in the application

-- Users can insert messages for projects they're involved in
CREATE POLICY "Users can insert project messages" ON project_messages
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now, we'll validate in the application

-- Create indexes for better performance
CREATE INDEX idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON project_messages(created_at);
CREATE INDEX idx_project_messages_is_read ON project_messages(is_read);

-- Add comments for documentation
COMMENT ON TABLE project_messages IS 'Stores messages between clients and freelancers for projects';
COMMENT ON COLUMN project_messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN project_messages.project_id IS 'Reference to the project this message belongs to';
COMMENT ON COLUMN project_messages.sender_id IS 'ID of the sender (client or freelancer profile ID)';
COMMENT ON COLUMN project_messages.sender_type IS 'Type of sender: client or freelancer';
COMMENT ON COLUMN project_messages.message IS 'The message text content';
COMMENT ON COLUMN project_messages.is_read IS 'Indicates whether the message has been read by the recipient';
COMMENT ON COLUMN project_messages.created_at IS 'Timestamp when the message was created';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'project_messages' 
ORDER BY ordinal_position;

-- Test insert to verify the table works (commented out to avoid test data)
-- INSERT INTO project_messages (project_id, sender_id, sender_type, message, is_read) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'client', 'Test message', false); 