-- Step 1: Update the file size limit
UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'work-products';
