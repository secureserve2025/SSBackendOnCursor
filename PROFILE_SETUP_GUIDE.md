# Profile System Setup Guide

## Overview
This guide will help you set up the complete profile system for freelancers and clients in SecureServe.

## 1. Database Setup

### Run the SQL Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `database_schema.sql`
4. Click **Run** to execute the schema

This will create:
- `freelancer_profiles` table
- `client_profiles` table
- `projects` table (enhanced)
- `transactions` table (enhanced)
- `messages` table
- All necessary RLS policies and triggers

## 2. Profile Fields

### Freelancer Profile Fields:
- **freelancer_id**: System generated (F123456789)
- **full_name**: User's full name
- **email**: User's email address
- **mobile_number**: 10-digit mobile number
- **country_code**: Phone country code (default: +91)
- **upi_id**: UPI ID for payments
- **aadhar_number**: Aadhar number (XXXX-XXXX-XXXX format)
- **profile_completed**: Boolean flag
- **profile_verified**: Boolean flag
- **account_status**: active/suspended/inactive

### Client Profile Fields:
- **client_id**: System generated (C123456789)
- **full_name**: User's full name
- **email**: User's email address
- **mobile_number**: 10-digit mobile number
- **country_code**: Phone country code (default: +91)
- **company_name**: Company name
- **business_type**: Type of business
- **pan_tan_number**: PAN/TAN number
- **upi_id**: UPI ID for payments
- **profile_completed**: Boolean flag
- **profile_verified**: Boolean flag
- **account_status**: active/suspended/inactive

## 3. Automatic Profile Creation

When a user signs up:
1. **Freelancer signup**: Automatically creates a row in `freelancer_profiles`
2. **Client signup**: Automatically creates a row in `client_profiles`
3. **System generates unique IDs**: F123456789 for freelancers, C123456789 for clients

## 4. Profile Completion Flow

### First-time Login:
1. User logs in to dashboard
2. System checks if profile is complete
3. If incomplete, shows profile completion form
4. User fills required fields
5. Profile is saved to Supabase
6. User can access full dashboard

### Required Fields for Completion:

**Freelancer:**
- Full Name
- Mobile Number (10 digits)
- UPI ID
- Aadhar Number (XXXX-XXXX-XXXX)

**Client:**
- Full Name
- Mobile Number (10 digits)
- Company Name
- PAN/TAN Number
- UPI ID

## 5. Validation Rules

### Mobile Number:
- Must be exactly 10 digits
- Only numeric characters allowed

### Aadhar Number:
- Format: XXXX-XXXX-XXXX
- Must be exactly 12 digits
- Auto-formatted as user types

### PAN/TAN Number:
- Format: ABCDE1234F
- 5 letters + 4 digits + 1 letter
- Auto-converted to uppercase

### UPI ID:
- Minimum 3 characters
- Can contain letters, numbers, and special characters

## 6. Testing the System

### Test Freelancer Flow:
1. Sign up as a freelancer
2. Login to freelancer dashboard
3. Complete profile form
4. Verify data is saved in `freelancer_profiles` table

### Test Client Flow:
1. Sign up as a client
2. Login to client dashboard
3. Complete profile form
4. Verify data is saved in `client_profiles` table

## 7. Database Queries for Verification

### Check Freelancer Profiles:
```sql
SELECT * FROM freelancer_profiles ORDER BY created_at DESC;
```

### Check Client Profiles:
```sql
SELECT * FROM client_profiles ORDER BY created_at DESC;
```

### Check Profile Completion:
```sql
SELECT 
  full_name,
  email,
  profile_completed,
  created_at
FROM freelancer_profiles 
WHERE profile_completed = true;

SELECT 
  full_name,
  email,
  profile_completed,
  created_at
FROM client_profiles 
WHERE profile_completed = true;
```

## 8. Troubleshooting

### Common Issues:

1. **Profile not created automatically:**
   - Check if triggers are created properly
   - Verify user_type in auth.users metadata

2. **RLS policies blocking access:**
   - Ensure user is authenticated
   - Check if user_id matches in profile tables

3. **Validation errors:**
   - Check field formats (mobile, aadhar, pan)
   - Ensure all required fields are filled

4. **Profile not saving:**
   - Check Supabase credentials in .env
   - Verify RLS policies allow updates

## 9. Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User isolation**: Users can only access their own data
- **Automatic profile creation**: Triggers handle new user setup
- **Data validation**: Client-side and server-side validation
- **Audit trail**: created_at and updated_at timestamps

## 10. Next Steps

After setting up the profile system:

1. **Test the complete flow** from signup to profile completion
2. **Implement project creation** using the enhanced projects table
3. **Add transaction handling** for payments
4. **Set up messaging system** between clients and freelancers
5. **Add profile verification** workflow for admin approval

## 11. Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The profile system is now ready to capture and store user information securely in Supabase! 