# Verification Reports RLS Fix Guide

## Problem Description
The AI verification feature is failing with the error: "new row violates row-level security policy for table 'verification_reports'". This happens when users click the "AI Verify" button in the client dashboard.

## Root Cause
The Row Level Security (RLS) policies on the `verification_reports` table are not properly configured to allow authenticated users to insert verification reports for their projects.

## Solution

### Step 1: Apply the Main Fix (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to the SQL Editor

2. **Run the Production Fix**
   - Copy the entire contents of `production_verification_reports_fix.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Fix**
   - The script will show diagnostic information
   - Check that all policies were created successfully
   - Ensure RLS is enabled

### Step 2: Test the Fix

1. **Test in Development**
   - Go to your client dashboard
   - Navigate to "My Projects"
   - Click "AI Verify" on a project
   - The verification should now work without errors

2. **Test in Production**
   - Deploy to Vercel
   - Test the AI verification feature in the live environment

### Step 3: Alternative Fix (If Main Fix Doesn't Work)

If the main fix doesn't resolve the issue, use the alternative approach:

1. **Run the Alternative Fix**
   - Copy the contents of `alternative_verification_reports_fix.sql`
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute

2. **This alternative provides more permissive policies**
   - Allows any authenticated user to create verification reports
   - Less secure but guaranteed to work
   - Can be tightened later once the main issue is resolved

## What the Fix Does

### Main Fix (`production_verification_reports_fix.sql`)
- **Diagnoses the current state** of RLS policies
- **Cleans up existing policies** that might be conflicting
- **Creates robust policies** that:
  - Check if user is authenticated (`auth.uid() IS NOT NULL`)
  - Verify the user has access to the project (as client or freelancer)
  - Handle all CRUD operations (SELECT, INSERT, UPDATE, DELETE)
- **Ensures RLS is enabled** for security
- **Provides comprehensive verification** of the fix

### Alternative Fix (`alternative_verification_reports_fix.sql`)
- **More permissive policies** that allow any authenticated user to create reports
- **Simpler logic** that's less likely to fail
- **Suitable as a backup** if the main fix doesn't work

## Security Considerations

### Main Fix (Recommended)
- ✅ **Secure**: Only allows users to access their own projects
- ✅ **Proper authentication checks**: Verifies user identity
- ✅ **Project relationship validation**: Ensures users can only access their projects

### Alternative Fix (Backup)
- ⚠️ **Less secure**: Allows any authenticated user to create reports
- ⚠️ **Should be temporary**: Use only until the main fix is working
- ⚠️ **Can be tightened later**: Once the main issue is resolved

## Deployment Checklist

- [ ] Run the main fix SQL script in Supabase
- [ ] Verify policies were created successfully
- [ ] Test AI verification in development
- [ ] Deploy to Vercel
- [ ] Test AI verification in production
- [ ] If issues persist, apply alternative fix
- [ ] Monitor for any security concerns

## Troubleshooting

### If the fix doesn't work:

1. **Check authentication**
   - Ensure users are properly logged in
   - Verify the user has a valid session

2. **Check project relationships**
   - Ensure the user is associated with the project (as client or freelancer)
   - Verify the project exists and is accessible

3. **Check database permissions**
   - Ensure the Supabase service role has proper permissions
   - Verify RLS is enabled on the table

4. **Use the alternative fix**
   - If all else fails, use the more permissive alternative fix

### Common Issues:

- **"Policy not found"**: The policy wasn't created properly
- **"RLS disabled"**: Row Level Security is not enabled
- **"User not authenticated"**: The user session is invalid
- **"Project not found"**: The project relationship is incorrect

## Rollback Plan

If you need to rollback the changes:

```sql
-- Drop all policies
DROP POLICY IF EXISTS "Users can view verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can create verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can update verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can delete verification reports for their projects" ON verification_reports;

-- Disable RLS (temporary)
ALTER TABLE verification_reports DISABLE ROW LEVEL SECURITY;
```

## Support

If you continue to experience issues after applying these fixes:

1. Check the Supabase logs for detailed error messages
2. Verify the user authentication flow is working correctly
3. Ensure the project relationships are properly established
4. Consider using the alternative fix as a temporary solution
