# Fix Profile Save Issue

## Problem
When clicking "Save Changes" button, you get the error: "Failed to save profile. Please try again."

## Root Cause
The issue is likely due to:
1. Missing `.env` file with Supabase credentials
2. Database tables not created in Supabase
3. Row Level Security (RLS) policies not set up

## Solution Steps

### Step 1: Create .env File
Create a file named `.env` in the `SSBackendOnCursor` directory with these contents:

```env
VITE_SUPABASE_URL=https://jwdpzqaptvzfgqylecsj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHB6cWFwdHZ6ZmdxeWxlY3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NTIxNzEsImV4cCI6MjA2OTIyODE3MX0.PSnunWHSZaWFhVWNSTI7o49fFyR0CFcgUZRkCAXDsE0
```

### Step 2: Create Database Tables
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `profile_tables_only.sql`
4. Click **Run** to execute the script

This will create:
- `freelancer_profiles` table
- `client_profiles` table
- RLS policies
- Triggers for automatic profile creation

### Step 3: Restart Development Server
After creating the `.env` file, restart your development server:

```bash
npm run dev
```

### Step 4: Test the Fix
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to save a profile
4. Check the console logs for detailed error messages

## Debugging

### Check Console Logs
The updated code now provides detailed logging. Look for:
- "Current user:" - Shows if user is authenticated
- "Profile data to save:" - Shows the data being saved
- "Profile update data:" - Shows the formatted data
- "Update result:" - Shows the response from Supabase
- Any error messages with specific details

### Common Error Messages

**"Supabase not configured"**
- Solution: Create the `.env` file with correct credentials

**"relation 'freelancer_profiles' does not exist"**
- Solution: Run the SQL script to create tables

**"new row violates row-level security policy"**
- Solution: Ensure RLS policies are created and user is authenticated

**"duplicate key value violates unique constraint"**
- Solution: Check if profile already exists for this user

## Verification Steps

### 1. Check Environment Variables
In browser console, run:
```javascript
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 2. Check Database Tables
In Supabase SQL Editor, run:
```sql
SELECT * FROM freelancer_profiles LIMIT 1;
SELECT * FROM client_profiles LIMIT 1;
```

### 3. Check RLS Policies
In Supabase SQL Editor, run:
```sql
SELECT * FROM pg_policies WHERE tablename = 'freelancer_profiles';
SELECT * FROM pg_policies WHERE tablename = 'client_profiles';
```

## Expected Behavior After Fix

1. **First-time user**: Profile will be created automatically when they sign up
2. **Existing user**: Profile will be updated when they save changes
3. **Console logs**: Will show successful operations
4. **Success message**: "Profile saved successfully!"

## If Still Having Issues

1. **Check Supabase Dashboard**:
   - Go to Authentication > Users
   - Verify your user exists
   - Check if user has `user_type` metadata

2. **Check Database**:
   - Go to Table Editor
   - Look for `freelancer_profiles` and `client_profiles` tables
   - Check if any data exists

3. **Check RLS**:
   - Go to Authentication > Policies
   - Verify policies are enabled for both tables

4. **Test with Simple Query**:
   In browser console:
   ```javascript
   import { supabase } from './src/lib/supabase';
   const { data, error } = await supabase.from('freelancer_profiles').select('*');
   console.log('Test query result:', { data, error });
   ```

The enhanced error logging will help identify the specific issue causing the save failure. 