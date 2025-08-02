import { analyzeFiles } from './fileAnalyzer.js';

// Example usage of the file analyzer
const testFileAnalyzer = async () => {
  // This is just an example - in real usage, you would get files from a file input
  console.log('File Analyzer Test');
  console.log('==================');
  
  // Example of how to use the analyzeFiles function
  // const files = document.getElementById('fileInput').files; // Get files from input
  // const result = await analyzeFiles(Array.from(files));
  
  console.log('Usage:');
  console.log('1. Import the function: import { analyzeFiles } from "./utils/fileAnalyzer.js"');
  console.log('2. Get files from file input or drag & drop');
  console.log('3. Call: const result = await analyzeFiles(files)');
  console.log('4. Access result.summary and result.fileDetails');
  
  console.log('\nSupported file types:');
  console.log('- TXT files: Full text extraction');
  console.log('- PDF files: Text extraction using pdf-parse');
  console.log('- DOC/DOCX files: Text extraction using mammoth');
  console.log('- MP4 files: Basic metadata (filename, size)');
  console.log('- Other files: Marked as unsupported');
  
  console.log('\nReturn format:');
  console.log('{');
  console.log('  summary: "Combined text content (max 1000 chars)",');
  console.log('  fileDetails: [');
  console.log('    {');
  console.log('      filename: "file.txt",');
  console.log('      size: 1024,');
  console.log('      type: "text/plain",');
  console.log('      content: "extracted text",');
  console.log('      summary: "Text file: first 200 chars..."');
  console.log('    }');
  console.log('  ]');
  console.log('}');
};

// Export for use in other files
export { testFileAnalyzer }; 