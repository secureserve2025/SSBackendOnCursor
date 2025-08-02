import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Analyzes uploaded files and extracts their content for AI processing
 * @param {Array} files - Array of file objects
 * @returns {Object} - Object containing summary text and file details array
 */
export const analyzeFiles = async (files) => {
  const fileDetails = [];
  let totalContent = '';
  const maxContentLength = 1000;

  for (const file of files) {
    try {
      let fileContent = '';
      let fileInfo = {
        filename: file.name,
        size: file.size,
        type: file.type,
        content: ''
      };

      // Process different file types
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Handle TXT files
        fileContent = await readTextFile(file);
        fileInfo.content = fileContent;
        fileInfo.summary = `Text file: ${fileContent.substring(0, 200)}${fileContent.length > 200 ? '...' : ''}`;
      } 
      else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Handle PDF files
        fileContent = await readPdfFile(file);
        fileInfo.content = fileContent;
        fileInfo.summary = `PDF file: ${fileContent.substring(0, 200)}${fileContent.length > 200 ? '...' : ''}`;
      } 
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               file.type === 'application/msword' || 
               file.name.endsWith('.docx') || 
               file.name.endsWith('.doc')) {
        // Handle DOC/DOCX files
        fileContent = await readDocFile(file);
        fileInfo.content = fileContent;
        fileInfo.summary = `Document file: ${fileContent.substring(0, 200)}${fileContent.length > 200 ? '...' : ''}`;
      } 
      else if (file.type === 'video/mp4' || file.name.endsWith('.mp4')) {
        // Handle MP4 files
        fileInfo = await readMp4File(file);
        fileInfo.summary = `Video file: ${fileInfo.filename} (${formatFileSize(fileInfo.size)})`;
      } 
      else {
        // Unsupported file type
        fileInfo.summary = `Unsupported file type: ${file.type}`;
        fileInfo.content = '';
      }

      // Add to total content if it's text-based
      if (fileContent && totalContent.length + fileContent.length <= maxContentLength) {
        totalContent += `\n\n--- ${file.name} ---\n${fileContent}`;
      } else if (fileContent && totalContent.length < maxContentLength) {
        // Truncate to fit within limit
        const remainingSpace = maxContentLength - totalContent.length;
        totalContent += `\n\n--- ${file.name} ---\n${fileContent.substring(0, remainingSpace)}...`;
      }

      fileDetails.push(fileInfo);

    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      fileDetails.push({
        filename: file.name,
        size: file.size,
        type: file.type,
        content: '',
        summary: 'Could not read file',
        error: error.message
      });
    }
  }

  return {
    summary: totalContent || 'No readable content found in uploaded files',
    fileDetails: fileDetails
  };
};

/**
 * Reads text content from a text file
 * @param {File} file - The file object
 * @returns {Promise<string>} - The text content
 */
const readTextFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

/**
 * Extracts text content from a PDF file
 * @param {File} file - The file object
 * @returns {Promise<string>} - The extracted text content
 */
const readPdfFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const pdfData = await pdfParse(arrayBuffer);
        resolve(pdfData.text || 'No text content found in PDF');
      } catch (error) {
        reject(new Error(`Failed to parse PDF: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extracts text content from a DOC/DOCX file
 * @param {File} file - The file object
 * @returns {Promise<string>} - The extracted text content
 */
const readDocFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value || 'No text content found in document');
      } catch (error) {
        reject(new Error(`Failed to parse document: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read document file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extracts metadata from an MP4 file
 * @param {File} file - The file object
 * @returns {Promise<Object>} - File metadata
 */
const readMp4File = async (file) => {
  return new Promise((resolve) => {
    // For MP4 files, we'll just return basic metadata
    // In a real implementation, you might want to use a library like ffmpeg.js
    // to extract more detailed video metadata
    resolve({
      filename: file.name,
      size: file.size,
      type: file.type,
      content: '',
      metadata: {
        duration: 'Unknown', // Would need video processing library to get this
        resolution: 'Unknown', // Would need video processing library to get this
        codec: 'Unknown' // Would need video processing library to get this
      }
    });
  });
};

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default analyzeFiles; 