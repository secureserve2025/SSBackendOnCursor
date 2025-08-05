-- Create work-products storage bucket and policies
-- This script sets up the storage bucket for video uploads

-- 1. Create the work-products bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-products',
  'work-products',
  true,
  10485760, -- 10MB limit
  ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for work-products bucket

-- Policy for uploading work products (freelancers can upload to their projects)
CREATE POLICY "Freelancers can upload work products for their projects" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'work-products' AND
  EXISTS (
    SELECT 1 FROM projects p
    JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
    WHERE fp.user_id = auth.uid()
    AND p.id::text = (storage.foldername(name))[2]
  )
);

-- Policy for viewing work products (both clients and freelancers can view)
CREATE POLICY "Users can view work products for their projects" ON storage.objects
FOR SELECT USING (
  bucket_id = 'work-products' AND
  (
    -- Freelancers can view their own uploads
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Clients can view work products for their projects
    EXISTS (
      SELECT 1 FROM projects p
      JOIN client_profiles cp ON p.client_id = cp.user_id
      WHERE cp.user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[2]
    )
    OR
    -- Freelancers can view work products for projects they're assigned to
    EXISTS (
      SELECT 1 FROM projects p
      JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
      WHERE fp.user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[2]
    )
  )
);

-- Policy for updating work products (freelancers can update their uploads)
CREATE POLICY "Freelancers can update their work products" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'work-products' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for deleting work products (freelancers can delete their uploads)
CREATE POLICY "Freelancers can delete their work products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'work-products' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'work-products';

-- 4. Verify the policies were created
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
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%work%';

-- 5. Test the setup
SELECT 'Work-products bucket and policies created successfully' as status; 