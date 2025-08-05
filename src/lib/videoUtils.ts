// Video utility functions for production use
import { supabase } from './supabase';

export interface VideoAccessResult {
  success: boolean;
  url?: string;
  error?: string;
  fallbackUrl?: string;
}

export interface VideoMetadata {
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  video_duration?: number;
  video_resolution?: string;
}

/**
 * Generate properly encoded video URL for Supabase storage
 */
export const generateVideoUrl = (filePath: string): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Don't apply encodeURIComponent since file_path is already in correct format
  return `${supabaseUrl}/storage/v1/object/public/work-products/${filePath}`;
};

/**
 * Test video accessibility with multiple fallback methods
 */
export const testVideoAccess = async (filePath: string): Promise<VideoAccessResult> => {
  try {
    const url = generateVideoUrl(filePath);
    
    // Test with HEAD request first
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    if (response.ok) {
      return { success: true, url };
    }
    
    // If HEAD fails, try alternative encoding
    const alternativeUrl = generateAlternativeUrl(filePath);
    const altResponse = await fetch(alternativeUrl, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    if (altResponse.ok) {
      return { success: true, url: alternativeUrl };
    }
    
    return { 
      success: false, 
      error: `Video not accessible (${response.status}: ${response.statusText})`,
      fallbackUrl: url 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fallbackUrl: generateVideoUrl(filePath)
    };
  }
};

/**
 * Generate alternative URL encoding for edge cases
 */
export const generateAlternativeUrl = (filePath: string): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Use the same format as generateVideoUrl for consistency
  return `${supabaseUrl}/storage/v1/object/public/work-products/${filePath}`;
};

/**
 * Validate video file metadata
 */
export const validateVideoMetadata = (metadata: VideoMetadata): boolean => {
  console.log('Validating video metadata:', metadata);
  
  if (!metadata.file_name) {
    console.error('Validation failed: Missing file name');
    return false;
  }
  
  // Check file size (max 50MB for demo)
  if (metadata.file_size > 50 * 1024 * 1024) {
    console.error('Validation failed: File too large', metadata.file_size);
    return false;
  }
  
  // Check file type - be more flexible with video types
  const validTypes = [
    'video/mp4', 
    'video/avi', 
    'video/mov', 
    'video/wmv', 
    'video/flv', 
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ];
  
  if (!validTypes.includes(metadata.file_type)) {
    console.error('Validation failed: Invalid file type', metadata.file_type);
    return false;
  }
  
  console.log('Video metadata validation passed');
  return true;
};

/**
 * Get video thumbnail or placeholder
 */
export const getVideoThumbnail = (filePath: string): string => {
  // For demo purposes, return a placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjM0I0NTU5Ii8+CjxwYXRoIGQ9Ik0xNDAgOTBMMjAwIDEyMEwxNDAgMTUwVjkwWiIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4K';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format video duration for display
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Check if video is accessible without authentication
 */
export const isVideoPubliclyAccessible = async (filePath: string): Promise<boolean> => {
  try {
    const url = generateVideoUrl(filePath);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get video player configuration for different browsers
 */
export const getVideoPlayerConfig = (url: string, fileType: string) => {
  return {
    controls: true,
    preload: 'metadata',
    poster: getVideoThumbnail(url),
    sources: [
      {
        src: url,
        type: fileType
      }
    ],
    // Cross-browser compatibility
    autoplay: false,
    muted: false,
    loop: false,
    // Mobile optimization
    playsInline: true,
    webkitPlaysinline: true
  };
};

/**
 * Handle video loading errors gracefully
 */
export const handleVideoError = (error: Event, fallbackUrl?: string): void => {
  console.error('Video loading error:', error);
  
  // Show user-friendly error message
  const errorMessage = 'Video failed to load. Please try refreshing the page or contact support if the issue persists.';
  
  // In production, you might want to log this to an analytics service
  if (import.meta.env.PROD) {
    console.log('Video error logged for analytics:', {
      error: error.type,
      url: fallbackUrl,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show alert only in development
  if (import.meta.env.DEV) {
    alert(errorMessage);
  }
};

/**
 * Validate Supabase configuration for video access
 */
export const validateSupabaseConfig = (): boolean => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
};

/**
 * Production-ready video access function
 */
export const accessVideo = async (workProduct: any): Promise<VideoAccessResult> => {
  // Validate configuration
  if (!validateSupabaseConfig()) {
    return {
      success: false,
      error: 'Invalid Supabase configuration'
    };
  }
  
  // Validate metadata
  if (!validateVideoMetadata(workProduct)) {
    return {
      success: false,
      error: 'Invalid video metadata'
    };
  }
  
  // Test accessibility
  return await testVideoAccess(workProduct.file_path);
};

/**
 * Enhanced video access that works with re-upload scenarios
 */
export const accessVideoWithReuploadSupport = async (workProduct: any, projectId?: string): Promise<VideoAccessResult> => {
  // Use existing access logic
  const result = await accessVideo(workProduct);
  
  // If this is a re-upload scenario, we can add additional logic here
  if (projectId && result.success) {
    // You can add re-upload specific logic here in the future
    // For now, it maintains backward compatibility
  }
  
  return result;
}; 