# Storage Policies Fix Guide

Since we can't modify `storage.objects` via SQL due to permission restrictions, we need to fix the storage policies manually in the Supabase Dashboard.

## Step 1: Run the SQL Fix

First, run `fix_project_files_simple.sql` to disable RLS on the `project_files` table.

## Step 2: Fix Storage Policies in Supabase Dashboard

### Navigate to Storage
1. Go to your **Supabase Dashboard**
2. Click on **"Storage"** in the left sidebar
3. Click on the **"project-files"** bucket

### Remove Existing Policies
1. Go to the **"Policies"** tab
2. **Delete all existing policies** for the project-files bucket
3. This will remove any policies that might be blocking uploads

### Create Simple Permissive Policies
Since you want freelancers to access project files, create these simple policies:

#### Policy 1: Allow All Authenticated Users to Upload
1. Click **"New Policy"**
2. Choose **"Create a policy from scratch"**
3. Set the following:
   - **Policy Name**: `Allow authenticated uploads`
   - **Allowed Operations**: `INSERT`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND auth.role() = 'authenticated'
   ```

#### Policy 2: Allow All Authenticated Users to View
1. Click **"New Policy"** again
2. Choose **"Create a policy from scratch"**
3. Set the following:
   - **Policy Name**: `Allow authenticated views`
   - **Allowed Operations**: `SELECT`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND auth.role() = 'authenticated'
   ```

#### Policy 3: Allow All Authenticated Users to Update
1. Click **"New Policy"** again
2. Choose **"Create a policy from scratch"**
3. Set the following:
   - **Policy Name**: `Allow authenticated updates`
   - **Allowed Operations**: `UPDATE`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND auth.role() = 'authenticated'
   ```

#### Policy 4: Allow All Authenticated Users to Delete
1. Click **"New Policy"** again
2. Choose **"Create a policy from scratch"**
3. Set the following:
   - **Policy Name**: `Allow authenticated deletes`
   - **Allowed Operations**: `DELETE`
   - **Policy Definition**:
   ```sql
   bucket_id = 'project-files' AND auth.role() = 'authenticated'
   ```

## Step 3: Test the File Upload

1. **Refresh your application**
2. **Create a new project** and upload a file
3. **Check the console logs** for successful upload
4. **Verify the file appears** in the `project_files` table

## Alternative: Disable RLS on Storage Bucket

If the above doesn't work, you can try:

1. Go to **Storage** → **project-files** bucket
2. Go to **"Settings"** tab
3. **Disable RLS** on the bucket (if the option is available)

## Expected Result

After completing these steps:
- ✅ **Storage uploads work** without RLS blocking
- ✅ **Database saves work** (RLS disabled on project_files)
- ✅ **Freelancers can access files** (no restrictions)
- ✅ **Files appear in project_files table**

---

**Status**: 🔧 **MANUAL SETUP REQUIRED**  
**Priority**: 🔴 **HIGH**  
**Next Step**: Run `fix_project_files_simple.sql` then fix storage policies manually

