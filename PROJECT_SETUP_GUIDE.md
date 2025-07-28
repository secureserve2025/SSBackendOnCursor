# Project Setup Guide for SecureServe Platform

This guide explains how to set up the projects table and form functionality according to the specified requirements.

## 📋 Project Form Requirements

### 1. Project ID
- **System Generated**: Automatically created when form is submitted
- **Format**: V + 4 digits (e.g., V0001, V1234)
- **Database Function**: Uses `generate_project_id()` function

### 2. Project Category
- **Type**: Dropdown with 40 character limit
- **Default**: "Video Production"
- **Other Options**: 
  - "Content Writing (will be enabled soon)"
  - "UI/UX Design (will be enabled soon)"
  - "Gen AI Services (will be enabled soon)"
- **Status**: Only Video Production is selectable

### 3. Project Name
- **Type**: Single line text input
- **Length**: 20 characters maximum
- **Validation**: Minimum 3 characters required

### 4. Freelancer ID
- **Type**: Text input with validation
- **Format**: F + 9 digits (e.g., F123456789)
- **Validation**: Must exist in freelancer_profiles table
- **Real-time**: Validates against database on blur

### 5. Desired Completion Date
- **Type**: Date picker
- **Validation**: Minimum date is tomorrow
- **Format**: YYYY-MM-DD

### 6. Project Requirement
- **Type**: Multi-line textarea
- **Length**: Maximum 200 characters
- **Validation**: Minimum 10 characters required
- **Features**: Live character counter, vertical scroll

### 7. File Upload Section
- **Type**: Drag-and-drop with browse option
- **Limit**: Maximum 2 files
- **Size**: 10MB per file maximum
- **Formats**: PDF, DOC, DOCX, JPG, PNG, MP4, etc.
- **Features**: Progress indicator, remove functionality

### 8. Deliverables Section
- **Type**: Dynamic array of text inputs
- **Initial**: 4 empty fields
- **Maximum**: 15 fields
- **Features**: Add/Remove controls, AI generation
- **Validation**: Minimum 3 filled deliverables required

## 🗄️ Database Setup

### 1. Run the Projects Table Script

Execute the `projects_table.sql` script in your Supabase SQL Editor:

```sql
-- This creates the projects table with all required fields and constraints
-- Run this in Supabase SQL Editor
```

### 2. Table Structure

```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(5) UNIQUE NOT NULL, -- V + 4 digits
    client_id VARCHAR(10) NOT NULL,
    freelancer_id VARCHAR(10) NOT NULL,
    project_category VARCHAR(40) NOT NULL DEFAULT 'Video Production',
    project_name VARCHAR(20) NOT NULL,
    project_requirement TEXT NOT NULL, -- Max 200 chars
    desired_completion_date DATE NOT NULL,
    project_files JSONB, -- File uploads
    deliverables JSONB NOT NULL, -- Deliverables array
    project_status VARCHAR(20) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Key Features

- **Row Level Security (RLS)**: Enabled for data protection
- **Automatic Project ID**: Generated using database function
- **Validation Functions**: Check freelancer/client IDs exist
- **Constraints**: Enforce data integrity
- **Indexes**: Optimize query performance

## 🔧 Form Implementation

### 1. Updated Components

The `AddProjectForm.tsx` component has been updated with:

- **Real-time validation**: Freelancer ID checks against database
- **Character counters**: For project name and requirements
- **File upload limits**: Maximum 2 files, 10MB each
- **Dynamic deliverables**: Add/remove up to 15 items
- **AI integration**: Generate deliverables with AI
- **Database integration**: Save projects to Supabase

### 2. Key Functions

```typescript
// Validate freelancer ID exists
const validateFreelancerIdExists = async (freelancerId: string) => {
  // Checks if freelancer ID exists in database
};

// Generate AI deliverables
const generateAIDeliverables = async () => {
  // Uses AI to generate project deliverables
};

// Create project in database
const handleFinalSubmit = async () => {
  // Saves project data to Supabase
};
```

## 🚀 Usage Instructions

### 1. For Clients

1. **Navigate to New Project**: Go to client dashboard → New Project tab
2. **Fill Project Details**:
   - Select category (Video Production only)
   - Enter project name (3-20 characters)
   - Enter valid freelancer ID (F + 9 digits)
   - Set completion date (tomorrow or later)
   - Describe requirements (10-200 characters)
   - Upload files (optional, max 2 files)
3. **Continue to Deliverables**: Click "Continue to Deliverables"
4. **Define Deliverables**:
   - Add/remove deliverable items (3-15 items)
   - Use "Generate via AI Assistant" for suggestions
   - Ensure at least 3 deliverables are filled
5. **Create Project**: Click "Create Project"
6. **Get Project ID**: System generates unique project ID (V + 4 digits)

### 2. For Developers

1. **Database Setup**: Run `projects_table.sql` in Supabase
2. **Environment Variables**: Ensure Supabase credentials are set
3. **Test Freelancer IDs**: Create test freelancer profiles first
4. **Test File Uploads**: Verify file size and type restrictions
5. **Test AI Integration**: Ensure AI deliverable generation works

## 🔍 Validation Rules

### Form Validation

- **Project Name**: 3-20 characters
- **Freelancer ID**: F + 9 digits, must exist in database
- **Completion Date**: Must be tomorrow or later
- **Project Requirement**: 10-200 characters
- **Files**: Max 2 files, 10MB each
- **Deliverables**: Minimum 3 filled items

### Database Constraints

- **Project ID**: Unique, auto-generated
- **Category**: 40 character limit
- **Name**: 3-20 character limit
- **Requirement**: 200 character limit
- **Completion Date**: Must be future date
- **Status**: Draft, Active, In Progress, Completed, Cancelled

## 🐛 Troubleshooting

### Common Issues

1. **Freelancer ID Not Found**
   - Ensure freelancer profile exists in database
   - Check ID format (F + 9 digits)
   - Verify Supabase connection

2. **File Upload Errors**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure maximum 2 files

3. **Project Creation Fails**
   - Check all required fields are filled
   - Verify validation rules are met
   - Check Supabase connection and permissions

4. **AI Generation Issues**
   - Ensure internet connection
   - Check AI service configuration
   - Verify API keys are set

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify Database**: Check if tables exist and have correct structure
3. **Test Supabase Connection**: Ensure credentials are correct
4. **Check Network**: Verify API calls are successful

## 📊 Database Relationships

### Foreign Keys

- `projects.client_id` → `client_profiles.id`
- `projects.freelancer_id` → `freelancer_profiles.id`

### RLS Policies

- **Clients**: Can view, insert, update their own projects
- **Freelancers**: Can view projects assigned to them

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Type and size restrictions
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 📈 Performance Optimizations

- **Database Indexes**: On frequently queried columns
- **File Upload Limits**: Prevent large file abuse
- **Character Counters**: Real-time validation feedback
- **Lazy Loading**: Components load as needed
- **Error Boundaries**: Graceful error handling

---

**Note**: This implementation focuses on video projects as specified. Other project categories are prepared for future enablement. 