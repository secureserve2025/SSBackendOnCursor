-- Fix for transaction creation issue
-- Add missing INSERT policy for transactions table

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