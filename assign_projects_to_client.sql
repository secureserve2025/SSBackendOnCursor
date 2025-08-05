-- Assign existing projects to the current client for testing
-- This will help test the messaging functionality

-- Update the projects to belong to the current client
UPDATE projects 
SET client_id = '68a6513d-4a95-49fe-a18e-e06704d192bf'  -- Current client's profile ID
WHERE client_id = 'df139dfb-21c7-4dc5-a704-dfd3d58aedf6';  -- Old client ID

-- Verify the update
SELECT 
  id,
  project_id,
  project_name,
  client_id,
  project_status_workflow
FROM projects 
ORDER BY created_at DESC;

-- Check if the current client now has projects
SELECT 
  p.id,
  p.project_id,
  p.project_name,
  p.client_id,
  p.project_status_workflow,
  cp.client_id as client_business_id,
  cp.full_name as client_name
FROM projects p
JOIN client_profiles cp ON p.client_id = cp.id
WHERE cp.id = '68a6513d-4a95-49fe-a18e-e06704d192bf'  -- Current client
ORDER BY p.created_at DESC; 