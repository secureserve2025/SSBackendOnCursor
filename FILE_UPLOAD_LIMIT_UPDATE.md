# File Upload Limit Update

## Overview
Updated the file upload functionality to allow only **one file** with a maximum size of **5MB** instead of the previous limit of two files with 10MB each.

## Changes Made

### Frontend Changes

#### 1. `src/components/AddProjectForm.tsx`
- **File size limit**: Changed from `10MB` to `5MB`
- **File count limit**: Changed from `2 files` to `1 file`
- **UI text**: Updated to "Max size: 5MB per file (max 1 file)"
- **File input**: Removed `multiple` attribute from file input
- **File handling**: Modified `handleFileUpload` to limit to 1 file

#### 2. `src/types/project.ts`
- **FILE_UPLOAD_CONFIG**: Updated `maxFiles` from 2 to 1
- **FILE_UPLOAD_CONFIG**: Updated `maxFileSize` from 10MB to 5MB

#### 3. `src/pages/ClientDashboard.tsx`
- **UI text**: Updated file upload text to "Max 5MB per file"

#### 4. `src/pages/FreelancerDashboard.tsx`
- **UI text**: Updated file upload text to "Max 5MB per file"

### Backend Changes

#### 1. `src/lib/supabase.ts`
- **File validation**: Updated size check from 10MB to 5MB in `createProject` function
- **Error message**: Updated to reflect 5MB limit

### Database
- **No schema changes required**: The `project_files` table structure remains the same
- **Application-level enforcement**: All limits are enforced in the frontend and API layer

## Current File Upload Configuration

- **Maximum files per project**: 1
- **Maximum file size**: 5MB (5,242,880 bytes)
- **Allowed file types**: PDF, DOC, DOCX
- **Allowed MIME types**:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## Validation Points

1. **Frontend validation**: File size and type checked before upload
2. **Backend validation**: File size and type validated in `createProject` function
3. **UI feedback**: Clear messaging about file limits and supported formats
4. **Error handling**: Proper error messages for oversized or unsupported files

## Testing

To test the new file upload limits:

1. **Single file limit**: Try uploading multiple files - only the first should be accepted
2. **File size limit**: Try uploading a file larger than 5MB - should show error
3. **File type validation**: Try uploading non-PDF/DOC/DOCX files - should be rejected
4. **UI feedback**: Verify all text references show "1 file" and "5MB"

## Impact

- **Storage optimization**: Reduced storage requirements per project
- **Upload performance**: Faster uploads with smaller files
- **User experience**: Clearer expectations about file requirements
- **System efficiency**: Reduced bandwidth and processing overhead 