# Disable RLS on Storage Objects

Since we can't disable RLS on `storage.objects` via SQL due to permission restrictions, we need to do it through the Supabase Dashboard.

## Step 1: Disable RLS on Storage Objects

1. **Go to your Supabase Dashboard**
2. **Click on "Table Editor"** in the left sidebar
3. **Look for "storage" schema** (you might need to expand it)
4. **Click on "objects" table**
5. **Go to "RLS" tab**
6. **Toggle off "Enable RLS"** (if the option is available)

## Step 2: Alternative - Check Storage Settings

If you can't disable RLS on storage.objects, try:

1. **Go to "Storage"** in the left sidebar
2. **Click on "project-files" bucket**
3. **Go to "Settings" tab**
4. **Look for any RLS or security settings**
5. **Disable any security restrictions**

## Step 3: Test File Upload

After disabling RLS:

1. **Refresh your application**
2. **Try uploading a file again**
3. **Check the console logs**

## Alternative Solution: Use a Different Bucket

If we can't disable RLS on storage.objects, we can:

1. **Create a new bucket** with a different name
2. **Make it public from the start**
3. **Update the code** to use the new bucket

## Expected Result

After disabling RLS on storage.objects:
- ✅ **Storage uploads work** without RLS blocking
- ✅ **Database saves work** (RLS disabled on project_files)
- ✅ **Files appear in project_files table**

---

**Status**: 🔧 **MANUAL SETUP REQUIRED**  
**Priority**: 🔴 **HIGH**  
**Next Step**: Try to disable RLS on storage.objects in Supabase Dashboard
