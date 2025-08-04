# File Upload Restriction Update

## Overview
Updated the file upload functionality to only allow document formats (PDF, DOC, DOCX) and removed support for video, image, and other file formats.

## Changes Made

### 1. Updated File Upload Configuration (`src/types/project.ts`)
- **Before**: Allowed PDF, DOC, DOCX, JPG, PNG, MP4
- **After**: Only PDF, DOC, DOCX
- **Removed**: 
  - `image/jpeg`, `image/png`, `video/mp4` from `allowedTypes`
  - `.jpg`, `.jpeg`, `.png`, `.mp4` from `allowedExtensions`

### 2. Updated AddProjectForm Component (`src/components/AddProjectForm.tsx`)
- **File Types**: Restricted `allowedFileTypes` array to only `.pdf`, `.doc`, `.docx`
- **UI Text**: Updated supported formats text from "PDF, DOC, DOCX, JPG, PNG, MP4, etc." to "PDF, DOC, DOCX"
- **Placeholder**: Changed deliverable placeholder from "High-quality 1080p video in MP4 format" to "Detailed project specification document in PDF format"

### 3. Updated ClientDashboard Component (`src/pages/ClientDashboard.tsx`)
- **File Upload Text**: Updated from "PDF, DOC, DOCX, JPG, PNG, MP4, ZIP, etc." to "PDF, DOC, DOCX"
- **Accepted File Types**: Changed from multiple formats to only `.pdf,.doc,.docx`
- **Deliverable Example**: Updated from "Optimized file format (MP4/MOV)" to "Optimized file format (PDF/DOC/DOCX)"

### 4. Updated FreelancerDashboard Component (`src/pages/FreelancerDashboard.tsx`)
- **File Upload Text**: Updated from "PDF, DOC, DOCX, JPG, PNG, MP4, ZIP, etc." to "PDF, DOC, DOCX"

### 5. Updated EmailTest Component (`src/components/EmailTest.tsx`)
- **Test Data**: Changed example deliverable from "High-quality 1080p video in MP4 format" to "Detailed project specification document in PDF format"

## Impact
- Users can now only upload document files (PDF, DOC, DOCX)
- Video, image, and other file formats are no longer supported
- UI text has been updated to reflect the new restrictions
- File upload validation will reject non-document files

## Testing Required
1. Test file upload with PDF, DOC, DOCX files (should work)
2. Test file upload with MP4, JPG, PNG files (should be rejected)
3. Verify UI text displays correctly
4. Check that file validation works as expected 