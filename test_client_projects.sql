-- Test script to check client projects and their statuses
-- This will help us understand why the messaging system shows 0 projects

-- First, let's see what client profiles exist
SELECT 
  id,
  client_id,
  full_name,
  email
FROM client_profiles 
ORDER BY created_at DESC;

-- Now let's see what projects exist and their statuses
SELECT 
  id,
  project_id,
  project_name,
  client_id,
  freelancer_id,
  project_status_workflow,
  created_at,
  updated_at
FROM projects 
ORDER BY created_at DESC;

-- Let's check if there are any projects for a specific client
-- Replace 'C780292353' with the actual client_id from the first query
SELECT 
  p.id,
  p.project_id,
  p.project_name,
  p.client_id,
  p.freelancer_id,
  p.project_status_workflow,
  cp.client_id as client_business_id,
  cp.full_name as client_name
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE cp.client_id = 'C780292353'  -- Replace with actual client_id
ORDER BY p.created_at DESC;

-- Let's also check what the valid project_status_workflow values are
SELECT DISTINCT project_status_workflow 
FROM projects 
ORDER BY project_status_workflow;

-- Check if the filtering in getProjectsForMessaging is working correctly
-- This should show projects that are NOT in (Draft,Closed,Cancelled)
SELECT 
  p.id,
  p.project_id,
  p.project_name,
  p.project_status_workflow,
  cp.client_id as client_business_id
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE cp.client_id = 'C780292353'  -- Replace with actual client_id
  AND p.project_status_workflow NOT IN ('Draft', 'Closed', 'Cancelled')
ORDER BY p.created_at DESC; 