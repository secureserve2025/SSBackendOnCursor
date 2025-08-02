# File Analyzer Utility

This utility provides file processing capabilities for extracting content from various file types for AI processing.

## Features

- **TXT Files**: Full text content extraction
- **PDF Files**: Text extraction using pdf-parse library
- **DOC/DOCX Files**: Text extraction using mammoth library
- **MP4 Files**: Basic metadata extraction (filename, size)
- **Error Handling**: Graceful error handling with fallback messages
- **Content Limits**: Keeps total extracted content under 1000 characters
- **File Type Detection**: Supports both MIME type and file extension detection

## Installation

The required dependencies are already installed:

```bash
npm install pdf-parse mammoth
```

## Usage

```javascript
import { analyzeFiles } from './utils/fileAnalyzer.js';

// Get files from file input or drag & drop
const files = document.getElementById('fileInput').files;

// Analyze the files
const result = await analyzeFiles(Array.from(files));

// Access the results
console.log(result.summary);        // Combined text content
console.log(result.fileDetails);    // Array of file details
```

## Return Format

The function returns an object with the following structure:

```javascript
{
  summary: "Combined text content from all files (max 1000 characters)",
  fileDetails: [
    {
      filename: "document.pdf",
      size: 1024000,
      type: "application/pdf",
      content: "extracted text content",
      summary: "PDF file: first 200 characters...",
      error: "error message if any"
    }
  ]
}
```

## File Details Object

Each file in the `fileDetails` array contains:

- `filename`: Original file name
- `size`: File size in bytes
- `type`: MIME type of the file
- `content`: Extracted text content (empty for non-text files)
- `summary`: Brief description of the file content
- `error`: Error message if file processing failed

## Supported File Types

| File Type | Extension | MIME Type | Processing |
|-----------|-----------|-----------|------------|
| Text | .txt | text/plain | Full text extraction |
| PDF | .pdf | application/pdf | Text extraction |
| Word Document | .docx, .doc | application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword | Text extraction |
| Video | .mp4 | video/mp4 | Basic metadata only |

## Error Handling

- Files that cannot be processed return "Could not read file" in the summary
- Individual file errors are logged to console
- The function continues processing other files even if one fails
- Unsupported file types are marked as such

## Content Limits

- Total combined content is limited to 1000 characters
- Individual file summaries are limited to 200 characters
- Content is truncated with "..." when limits are exceeded

## Dependencies

- `pdf-parse`: For PDF text extraction
- `mammoth`: For DOC/DOCX text extraction

## Browser Compatibility

This utility uses modern browser APIs:
- FileReader API for file reading
- ArrayBuffer for binary file processing
- ES6 modules for imports/exports

## Future Enhancements

- Support for more video formats with detailed metadata
- Image file processing with OCR capabilities
- Audio file transcription
- Excel/CSV file processing
- PowerPoint presentation text extraction

---

# Project Summary Generator

This utility creates structured project summaries for AI processing by combining project information with file analysis.

## Features

- **Structured Output**: Generates summaries in a consistent format for AI processing
- **File Integration**: Uses the file analyzer to process uploaded files
- **Scope Assessment**: Automatically assesses project complexity (simple/medium/complex)
- **Error Handling**: Graceful handling of missing or invalid data
- **Word Limits**: Ensures summaries stay under 500 words
- **Date Formatting**: Formats completion dates for readability

## Usage

```javascript
import { generateProjectSummary } from './utils/projectSummary.js';

const projectData = {
  name: 'E-commerce Website Development',
  requirements: 'Create a responsive e-commerce website...',
  files: fileInput.files, // Array of file objects
  deliverables: existingDeliverables, // Array of deliverable objects
  freelancer_id: 'FL12345',
  completion_date: '2024-03-15'
};

const summary = await generateProjectSummary(projectData);
console.log(summary);
```

## Input Format

The function expects a project data object with the following properties:

```javascript
{
  name: string,              // Project name (required)
  requirements: string,       // Project requirements text
  files: Array,              // Array of file objects
  deliverables: Array,       // Array of deliverable objects
  freelancer_id: string,     // Freelancer identifier
  completion_date: string    // Desired completion date
}
```

## Output Format

The function returns a structured text summary in this exact format:

```
PROJECT: [project name]
REQUIREMENTS: [project requirements text]
TIMELINE: Due [formatted completion date], assigned to freelancer [freelancer_id]
UPLOADED FILES: [summary from file analysis]
EXISTING DELIVERABLES: [list of deliverables or "None yet"]
SCOPE: [simple/medium/complex assessment]
```

## Scope Assessment Logic

The scope is automatically determined based on:
- **Requirements length**: Short (<100 chars), Medium (100-500 chars), Long (>500 chars)
- **Word count**: Low (<20 words), Medium (20-100 words), High (>100 words)
- **File count**: None (0 files), Few (1-2 files), Many (3+ files)

Scoring system:
- **Simple**: Score ≤ 4
- **Medium**: Score 5-7
- **Complex**: Score ≥ 8

## Error Handling

- Missing data is handled with default values
- File analysis errors are caught and reported
- Invalid dates are handled gracefully
- Empty deliverables are marked as "None yet"
- Total summary is limited to 500 words

## Helper Functions

- `validateProjectData(projectData)`: Validates project data structure
- `assessProjectScope(requirements, fileCount)`: Determines project complexity
- `formatCompletionDate(date)`: Formats dates for display
- `truncateToWordLimit(text, limit)`: Ensures word limits are respected

## Integration with File Analyzer

The project summary generator automatically uses the file analyzer to process uploaded files and include their content in the summary. This provides a comprehensive view of the project for AI processing. 