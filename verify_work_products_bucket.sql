-- Step 2: Verify the update was successful
SELECT 
  id,
  name,
  public,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as file_size_limit_mb,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'work-products';
