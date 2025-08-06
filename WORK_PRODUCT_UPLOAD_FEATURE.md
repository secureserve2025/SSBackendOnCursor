# Work Product Upload Feature

## Overview
The Work Product Upload feature allows freelancers to upload their final video work to the system, which is then stored in the `work_products` storage bucket with proper mapping to project IDs and other metadata.

## Features

### 1. File Upload Functionality
- **Location**: Freelancer Dashboard → My Projects tab
- **Trigger**: Click "Upload" button for projects with "Production in Progress" status
- **File Types**: MP4, AVI, MOV, WMV, FLV, WebM
- **Size Limit**: 50MB maximum
- **Storage**: Files are stored in Supabase `work-products` bucket

### 2. Database Schema
The `work_products` table stores:
- `id`: UUID primary key
- `project_id`: References the project (foreign key)
- `file_name`: Original filename
- `file_path`: Storage path in Supabase
- `file_size`: File size in bytes
- `file_type`: MIME type (e.g., video/mp4)
- `storage_bucket`: Default 'work-products'
- `video_duration`: Duration in seconds
- `video_resolution`: Resolution (e.g., "1920x1080")
- `video_format`: Format (e.g., "MP4", "AVI")
- `upload_status`: Status ('Uploading', 'Uploaded', 'Failed')
- `created_at`: Upload timestamp
- `updated_at`: Last update timestamp

### 3. Upload Process

#### Step 1: File Selection
- User clicks "Upload" button in My Projects table
- Modal opens with file selection interface
- File validation occurs:
  - File type must be video
  - File size must be < 50MB
  - Supported formats are checked

#### Step 2: Upload to Storage
- File is uploaded to Supabase `work-products` bucket
- Path format: `{userId}/{projectId}/{fileName}`
- Progress indicator shows upload status

#### Step 3: Database Record Creation
- Metadata is saved to `work_products` table
- Project status is updated to "AI Verified"
- File URL is generated for client access

### 4. User Interface

#### Upload Modal
- Shows project information
- File selection with validation
- Progress indicator
- Success/error messages
- File details display

#### Projects Table
- Shows upload button for eligible projects
- Displays existing work products count
- Play button for uploaded videos

### 5. Error Handling
- File size validation
- File type validation
- Network error handling
- Database error handling
- Storage cleanup on failure

### 6. Security Features
- User authentication required
- File type validation
- Size limits enforced
- Project ownership verification
- No file overwriting (upsert: false)

## Technical Implementation

### Key Functions

#### `uploadWorkProduct(projectId, file, metadata)`
```javascript
// Uploads file to storage and saves metadata
const { data, error } = await uploadWorkProduct(
  projectId,
  file,
  {
    duration: 0,
    resolution: 'Unknown',
    format: 'MP4'
  }
);
```

#### `handleUploadSubmit()`
- Manages upload process
- Shows progress
- Handles errors
- Updates UI state

#### `handleFileSelect()`
- Validates file selection
- Checks file type and size
- Provides user feedback

### Storage Structure
```
work-products/
├── {userId}/
│   ├── {projectId}/
│   │   ├── video1.mp4
│   │   ├── video2.avi
│   │   └── ...
│   └── ...
```

### Database Relationships
- `work_products.project_id` → `projects.id`
- Cascade delete when project is deleted
- Index on `project_id` for performance

## Usage Instructions

### For Freelancers
1. Navigate to My Projects tab
2. Find project with "Production in Progress" status
3. Click "Upload" button
4. Select video file (max 50MB)
5. Click "Upload Final Work"
6. Wait for upload completion
7. Verify file appears in projects table

### For Clients
1. Navigate to project details
2. View uploaded work products
3. Click "Play" to view video
4. Review uploaded content

## Testing

### Manual Testing
1. Create a test project with "Production in Progress" status
2. Upload a video file
3. Verify file appears in database
4. Check storage bucket for file
5. Verify project status updates

### Automated Testing
Run the test script:
```sql
-- Execute test_work_product_upload.sql
```

## Troubleshooting

### Common Issues
1. **File too large**: Reduce file size to < 50MB
2. **Unsupported format**: Convert to MP4, AVI, MOV, WMV, FLV, or WebM
3. **Upload fails**: Check network connection and try again
4. **Database error**: Contact support

### Debug Information
- Check browser console for error messages
- Verify Supabase storage bucket exists
- Confirm database permissions
- Check file path format

## Future Enhancements
- Video metadata extraction (duration, resolution)
- Multiple file upload support
- File compression options
- Advanced video format support
- Upload resume functionality
- Batch upload capabilities

## Security Considerations
- File type validation prevents malicious uploads
- Size limits prevent storage abuse
- User authentication required
- Project ownership verification
- No direct file access without authentication 