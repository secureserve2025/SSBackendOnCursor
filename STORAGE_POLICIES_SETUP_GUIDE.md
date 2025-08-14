# Storage Policies Setup Guide

Since you can't create storage policies via SQL (due to permission restrictions), you need to set them up manually in the Supabase Dashboard.

## Step 1: Run the Minimal Fix Script

First, run `fix_project_file_upload_minimal.sql` in your Supabase SQL Editor. This will:
- ✅ Create the storage bucket
- ✅ Create the project_files table
- ✅ Set up RLS policies for project_files table

## Step 2: Set Up Storage Policies in Supabase Dashboard

### Navigate to Storage
1. Go to your Supabase Dashboard
2. Click on "Storage" in the left sidebar
3. You should see the "project-files" bucket created

### Create Storage Policies

#### Policy 1: Allow Users to Upload Files
1. Click on the "project-files" bucket
2. Go to "Policies" tab
3. Click "New Policy"
4. Choose "Create a policy from scratch"
5. Set the following:
   - **Policy Name**: `Users can upload project files`
   - **Allowed Operations**: `INSERT`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

#### Policy 2: Allow Users to View Files
1. Click "New Policy" again
2. Choose "Create a policy from scratch"
3. Set the following:
   - **Policy Name**: `Users can view their project files`
   - **Allowed Operations**: `SELECT`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

#### Policy 3: Allow Users to Update Files
1. Click "New Policy" again
2. Choose "Create a policy from scratch"
3. Set the following:
   - **Policy Name**: `Users can update their project files`
   - **Allowed Operations**: `UPDATE`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

#### Policy 4: Allow Users to Delete Files
1. Click "New Policy" again
2. Choose "Create a policy from scratch"
3. Set the following:
   - **Policy Name**: `Users can delete their project files`
   - **Allowed Operations**: `DELETE`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

## Step 3: Verify the Setup

### Check Storage Bucket
1. In Storage section, verify the "project-files" bucket exists
2. Check that it has the correct file size limit (5MB)
3. Verify the allowed MIME types include:
   - `application/pdf`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Check Project Files Table
1. Go to "Table Editor" in Supabase Dashboard
2. Look for the "project_files" table
3. Verify it has the correct structure:
   - `id` (UUID, Primary Key)
   - `project_id` (UUID, Foreign Key to projects)
   - `file_name` (VARCHAR)
   - `file_path` (VARCHAR)
   - `file_size` (BIGINT)
   - `file_type` (VARCHAR)
   - `storage_bucket` (VARCHAR)
   - `uploaded_at` (TIMESTAMP)
   - `created_at` (TIMESTAMP)

### Check RLS Policies
1. In Table Editor, click on "project_files" table
2. Go to "RLS" tab
3. Verify these policies exist:
   - `Users can view files for their projects`
   - `Users can upload files for their projects`
   - `Users can update files for their projects`
   - `Users can delete files for their projects`

## Step 4: Test the File Upload

1. **Refresh your application** to get the updated code
2. **Create a new project** and try uploading a PDF, DOC, or DOCX file
3. **Check the browser console** for the debug logs
4. **Verify the file appears** in the `project_files` table

## Troubleshooting

### If Storage Policies Don't Work
- Make sure you're logged in as the correct user
- Check that the bucket name is exactly "project-files"
- Verify the policy definitions are correct

### If File Upload Still Fails
- Check the browser console for error messages
- Run the diagnostic script: `test_file_upload_debug.sql`
- Verify the storage bucket exists and is accessible

### If RLS Policies Don't Work
- Check that the `project_files` table has RLS enabled
- Verify the policy definitions match your database structure
- Test with a simple policy first

## Expected Result

After completing these steps:
- ✅ Storage bucket "project-files" exists with correct settings
- ✅ Project files table exists with proper structure
- ✅ RLS policies are in place for security
- ✅ Storage policies allow file uploads
- ✅ File uploads work correctly
- ✅ Files are saved to the database
- ✅ AI agent can access uploaded files

---

**Status**: 🔧 **MANUAL SETUP REQUIRED**  
**Priority**: 🔴 **HIGH**  
**Next Step**: Run `fix_project_file_upload_minimal.sql` then set up storage policies manually

