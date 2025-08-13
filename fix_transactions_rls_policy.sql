-- Fix RLS Policy for Transactions Table
-- This script fixes the RLS policy that's preventing transaction creation

-- 1. First, let's check the current RLS policies on the transactions table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 2. Drop all existing RLS policies for transactions table
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their projects" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Clients can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Clients can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Clients can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Clients can create transactions for their projects" ON transactions;
DROP POLICY IF EXISTS "Clients can update transactions for their projects" ON transactions;

-- 3. Create the correct RLS policies for the current schema
-- Policy for viewing transactions (clients and freelancers can view their project transactions)
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

-- Policy for creating transactions (only clients can create transactions for their projects)
CREATE POLICY "Clients can create transactions for their projects" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT cp.user_id FROM client_profiles cp 
      JOIN projects p ON p.client_id = cp.id 
      WHERE p.id = transactions.project_id
    )
  );

-- Policy for updating transactions (only clients can update transactions for their projects)
CREATE POLICY "Clients can update transactions for their projects" ON transactions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT cp.user_id FROM client_profiles cp 
      JOIN projects p ON p.client_id = cp.id 
      WHERE p.id = transactions.project_id
    )
  );

-- 4. Test the RLS policy by checking if the current user can create a transaction
SELECT 
    'Current User ID' as test_type,
    auth.uid() as current_user_id;

-- 5. Check if the project exists and belongs to the current user
SELECT 
    'Project Ownership Check' as test_type,
    p.id as project_id,
    p.project_name,
    cp.id as client_profile_id,
    cp.user_id as client_user_id
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE p.id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'::UUID;

-- 6. Verify the policy allows the current user to create transactions for this project
SELECT 
    'RLS Policy Test for Transactions' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM client_profiles cp 
            JOIN projects p ON p.client_id = cp.id 
            WHERE p.id = '2a3edcb4-6c71-45d7-9717-fc2a0c0f32a5'::UUID
            AND cp.user_id = auth.uid()
        ) THEN '✅ User can create transaction for this project'
        ELSE '❌ User cannot create transaction for this project'
    END as transaction_policy_test;









