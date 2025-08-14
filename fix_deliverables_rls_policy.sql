-- Fix RLS policies for deliverables table
-- This script drops existing policies and creates correct ones

-- 1. Drop existing RLS policies on deliverables table
DROP POLICY IF EXISTS "Users can view deliverables for their projects" ON deliverables;
DROP POLICY IF EXISTS "Users can manage deliverables for their projects" ON deliverables;
DROP POLICY IF EXISTS "Users can view deliverables for their projects" ON deliverables;
DROP POLICY IF EXISTS "Users can manage deliverables for their projects" ON deliverables;

-- 2. Create correct RLS policies for deliverables table
-- Policy for viewing deliverables (both clients and freelancers can view)
CREATE POLICY "Users can view deliverables for their projects" ON deliverables
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN client_profiles cp ON p.client_id = cp.id
      WHERE cp.user_id = auth.uid()
      UNION
      SELECT p.id FROM projects p
      JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- Policy for inserting deliverables (clients can create deliverables for their projects)
CREATE POLICY "Clients can create deliverables for their projects" ON deliverables
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN client_profiles cp ON p.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Policy for updating deliverables (both clients and freelancers can update)
CREATE POLICY "Users can update deliverables for their projects" ON deliverables
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN client_profiles cp ON p.client_id = cp.id
      WHERE cp.user_id = auth.uid()
      UNION
      SELECT p.id FROM projects p
      JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- Policy for deleting deliverables (clients can delete deliverables from their projects)
CREATE POLICY "Clients can delete deliverables from their projects" ON deliverables
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN client_profiles cp ON p.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- 3. Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'deliverables'
ORDER BY policyname;











