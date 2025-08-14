# File Upload Restrictions - Project Files

## Allowed File Types

The project file upload system now **only accepts** the following file types:

### 1. PDF Files
- **Extension**: `.pdf`
- **MIME Type**: `application/pdf`
- **Description**: Adobe Portable Document Format files

### 2. DOC Files
- **Extension**: `.doc`
- **MIME Type**: `application/msword`
- **Description**: Microsoft Word documents (legacy format)

### 3. DOCX Files
- **Extension**: `.docx`
- **MIME Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Description**: Microsoft Word documents (modern format)

## File Size Limits

- **Maximum file size**: 5MB per file
- **Maximum files per project**: 1 file
- **Total storage limit**: 5MB per project

## Validation Layers

### 1. Frontend Validation (AddProjectForm.tsx)
- File extension validation (`.pdf`, `.doc`, `.docx`)
- MIME type validation
- File size validation (5MB limit)
- Real-time user feedback

### 2. Backend Validation (supabase.ts)
- MIME type validation on server side
- File size validation
- Storage bucket restrictions

### 3. Storage Bucket Configuration
- MIME type restrictions at bucket level
- File size limits enforced by Supabase

### 4. File Processing (fileAnalyzer.js)
- Only processes PDF, DOC, and DOCX files
- Extracts text content for AI processing
- Provides meaningful error messages for unsupported files

## Error Messages

### Unsupported File Type
```
"Unsupported file type: [file_type]. Only PDF, DOC, and DOCX files are allowed."
```

### File Too Large
```
"File [filename] exceeds 5MB limit"
```

### File Validation Failed
```
"File type [file_type] is not allowed"
```

## Implementation Details

### Frontend Configuration
```javascript
const allowedFileTypes = ['.pdf', '.doc', '.docx'];
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
```

### Storage Bucket Configuration
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files',
    false,
    5242880, -- 5MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
);
```

## User Experience

### File Selection
- File picker only shows PDF, DOC, and DOCX files
- Drag and drop accepts only allowed file types
- Clear error messages for rejected files

### Upload Process
- Real-time validation feedback
- Progress indicators for file uploads
- Success/error status display

### AI Processing
- Only allowed file types are processed by AI agent
- Text extraction from PDF, DOC, and DOCX files
- Content analysis for deliverable generation

## Security Considerations

- File type validation on multiple layers
- MIME type verification prevents file type spoofing
- File size limits prevent abuse
- Storage bucket restrictions enforce policies at infrastructure level

## Testing

To test the file upload restrictions:

1. **Valid Files**: Try uploading PDF, DOC, and DOCX files
2. **Invalid Files**: Try uploading other file types (TXT, JPG, MP4, etc.)
3. **Large Files**: Try uploading files larger than 5MB
4. **Multiple Files**: Try uploading more than 1 file

Expected behavior:
- ✅ Valid files should upload successfully
- ❌ Invalid files should be rejected with clear error messages
- ❌ Large files should be rejected
- ❌ Multiple files should be limited to 1 file

---

**Status**: ✅ **IMPLEMENTED**  
**Last Updated**: Current  
**Restrictions**: PDF, DOC, DOCX only, 5MB max, 1 file per project

