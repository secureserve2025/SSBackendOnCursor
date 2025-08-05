# Video Access Troubleshooting Guide

## Issue: 404 Error When Accessing Video Files

### Current Status
- Video URLs are being constructed correctly
- File paths contain spaces and special characters
- 404 errors suggest either file doesn't exist or access is blocked

## Step-by-Step Debugging

### 1. Run the Diagnostic SQL Script

First, run the `diagnose_video_issue.sql` script in your Supabase SQL editor to check:

```sql
-- Execute diagnose_video_issue.sql
```

This will show you:
- If work_products table has data
- The specific project and file details
- Current storage policies
- Storage bucket configuration

### 2. Apply Storage Policy Fix

If the storage policies haven't been applied yet, run:

```sql
-- Execute fix_storage_policies.sql
```

### 3. Test URL Encoding

The file path contains spaces and special characters. I've updated the code to use `encodeURIComponent()` for proper URL encoding.

**Before:**
```
https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated File June 19, 2025 - 3_07PM.mp4
```

**After (with encoding):**
```
https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b%2F49f8f594-14c2-4996-9707-488bcfabdd43%2FGenerated%20File%20June%2019%2C%202025%20-%203_07PM.mp4
```

### 4. Browser Console Test

Run the `test_video_access.js` script in your browser console to test:

```javascript
// Copy and paste the content of test_video_access.js into browser console
```

This will test:
- Different URL encoding formats
- Authentication status
- Storage access permissions

### 5. Manual URL Testing

Test these URLs directly in your browser:

1. **Original URL (likely to fail):**
   ```
   https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated File June 19, 2025 - 3_07PM.mp4
   ```

2. **URL-encoded version:**
   ```
   https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b%2F49f8f594-14c2-4996-9707-488bcfabdd43%2FGenerated%20File%20June%2019%2C%202025%20-%203_07PM.mp4
   ```

3. **Space-encoded version:**
   ```
   https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated%20File%20June%2019,%202025%20-%203_07PM.mp4
   ```

## Common Issues and Solutions

### Issue 1: File Doesn't Exist in Storage
**Symptoms:** 404 error on all URL formats
**Solution:** 
1. Check if the file was actually uploaded to Supabase storage
2. Verify the file path in the `work_products` table
3. Check if the upload process completed successfully

### Issue 2: Storage Policies Blocking Access
**Symptoms:** 404 error even when file exists
**Solution:**
1. Apply the storage policy fixes from `fix_storage_policies.sql`
2. Verify the bucket is public
3. Check RLS policies on the `work_products` table

### Issue 3: URL Encoding Issues
**Symptoms:** 404 on original URL, 200 on encoded URL
**Solution:** ✅ **FIXED** - Updated code to use `encodeURIComponent()`

### Issue 4: Authentication Issues
**Symptoms:** 401 or 403 errors
**Solution:**
1. Check if user is authenticated
2. Verify user has access to the project
3. Check storage policies for the specific user

### Issue 5: Bucket Configuration Issues
**Symptoms:** 404 errors across all files
**Solution:**
1. Verify `work-products` bucket exists
2. Check if bucket is public
3. Verify bucket permissions

## Updated Code Changes

### ClientDashboard.tsx & FreelancerDashboard.tsx

**Key Changes:**
1. Added `encodeURIComponent()` for proper URL encoding
2. Enhanced logging for debugging
3. Updated video modal to use encoded URLs
4. Updated download and "Open in New Tab" buttons

**Before:**
```javascript
const storageUrl = `${supabaseUrl}/storage/v1/object/public/work-products/${workProduct.file_path}`;
```

**After:**
```javascript
const encodedFilePath = encodeURIComponent(workProduct.file_path);
const storageUrl = `${supabaseUrl}/storage/v1/object/public/work-products/${encodedFilePath}`;
```

## Testing Steps

### 1. Apply All Fixes
1. Run `fix_storage_policies.sql` in Supabase SQL editor
2. Deploy the updated React code
3. Clear browser cache

### 2. Test Video Access
1. Navigate to Client Dashboard → My Projects
2. Click on a video file link
3. Check browser console for new logs
4. Verify video opens in new tab or modal

### 3. Test Different Scenarios
1. Test with different browsers
2. Test with popup blockers enabled/disabled
3. Test with slow internet connection
4. Test with non-existent files

## Expected Results

After applying all fixes:

✅ **Video opens in new tab** (if popup allowed)
✅ **Video modal appears** (if popup blocked)
✅ **Download button works**
✅ **"Open in New Tab" button works**
✅ **Proper error messages** for missing files
✅ **Console logs** show encoded URLs

## If Issues Persist

### 1. Check Supabase Dashboard
- Go to Storage section in Supabase dashboard
- Verify `work-products` bucket exists
- Check if files are actually uploaded
- Verify bucket permissions

### 2. Check Database
- Run the diagnostic SQL script
- Verify work_products table has correct data
- Check if file paths match actual storage paths

### 3. Check Network Tab
- Open browser developer tools
- Go to Network tab
- Click video link
- Check the actual HTTP request and response

### 4. Contact Support
If all else fails, provide:
- Diagnostic SQL results
- Browser console logs
- Network tab screenshots
- Supabase storage bucket configuration

## Quick Fix Summary

The main issue was likely **URL encoding** for file paths with spaces and special characters. The updated code now:

1. ✅ Uses `encodeURIComponent()` for proper URL encoding
2. ✅ Includes comprehensive error handling
3. ✅ Provides fallback video modal
4. ✅ Includes detailed logging for debugging
5. ✅ Updates all video-related URLs consistently

Try the updated code and let me know if you still get 404 errors! 