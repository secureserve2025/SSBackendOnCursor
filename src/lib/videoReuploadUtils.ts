// Video Re-upload Utilities for Future-Proof Implementation
// This ensures existing video functionality remains intact when re-upload is enabled

import { supabase } from './supabase';
import { generateVideoUrl, validateVideoMetadata, formatFileSize, formatDuration } from './videoUtils';

export interface ReuploadOptions {
  replaceExisting?: boolean;
  keepHistory?: boolean;
  notifyClient?: boolean;
  updateStatus?: boolean;
}

export interface ReuploadResult {
  success: boolean;
  newWorkProduct?: any;
  oldWorkProduct?: any;
  error?: string;
  message?: string;
}

/**
 * Check if a project already has a work product uploaded
 */
export const hasExistingWorkProduct = async (projectId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('work_products')
      .select('id, file_name, created_at')
      .eq('project_id', projectId)
      .eq('upload_status', 'Uploaded')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking existing work product:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking existing work product:', error);
    return false;
  }
};

/**
 * Get the most recent work product for a project
 */
export const getLatestWorkProduct = async (projectId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('work_products')
      .select('*')
      .eq('project_id', projectId)
      .eq('upload_status', 'Uploaded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error getting latest work product:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting latest work product:', error);
    return null;
  }
};

/**
 * Archive existing work product (for history tracking)
 */
export const archiveWorkProduct = async (workProductId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('work_products')
      .update({ 
        upload_status: 'Archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', workProductId);

    if (error) {
      console.error('Error archiving work product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error archiving work product:', error);
    return false;
  }
};

/**
 * Enhanced upload function that handles re-uploads gracefully
 */
export const uploadWorkProductWithReupload = async (
  projectId: string, 
  file: File, 
  metadata: any,
  options: ReuploadOptions = {}
): Promise<ReuploadResult> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Validate file
    console.log('File being validated:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    if (!validateVideoMetadata({ 
      file_name: file.name, 
      file_path: 'temp', 
      file_size: file.size, 
      file_type: file.type 
    })) {
      return {
        success: false,
        error: 'Invalid video file - please check file type and size'
      };
    }

    // Check for existing work product
    const existingWorkProduct = await getLatestWorkProduct(projectId);
    const hasExisting = !!existingWorkProduct;

    if (hasExisting && !options.replaceExisting) {
      return {
        success: false,
        error: 'Project already has a work product. Enable replace option to overwrite.',
        oldWorkProduct: existingWorkProduct
      };
    }

    // Generate unique file path to avoid conflicts
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${file.name.replace(`.${fileExtension}`, '')}_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${projectId}/${uniqueFileName}`;

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('work-products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading work product:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('work-products')
      .getPublicUrl(filePath);

    // Extract video format
    const videoFormat = file.name.split('.').pop()?.toUpperCase() || 'MP4';

    // Archive existing work product if keeping history
    if (hasExisting && options.keepHistory) {
      await archiveWorkProduct(existingWorkProduct.id);
    }

    // Delete old file from storage if replacing
    if (hasExisting && options.replaceExisting && !options.keepHistory) {
      try {
        await supabase.storage
          .from('work-products')
          .remove([existingWorkProduct.file_path]);
      } catch (deleteError) {
        console.warn('Failed to delete old file:', deleteError);
      }
    }

    // Save new work product to database
    const { data: dbData, error: dbError } = await supabase
      .from('work_products')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        video_duration: metadata.duration || 0,
        video_resolution: metadata.resolution || 'Unknown',
        video_format: videoFormat,
        upload_status: 'Uploaded',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving work product metadata:', dbError);
      // Cleanup uploaded file if database insert fails
      try {
        await supabase.storage.from('work-products').remove([filePath]);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
      return {
        success: false,
        error: `Database error: ${dbError.message}`
      };
    }

    // Update project status if requested
    if (options.updateStatus) {
      try {
        await supabase.rpc('update_project_status_workflow', {
          project_uuid: projectId,
          new_status: 'AI Verified'
        });
      } catch (statusError) {
        console.warn('Failed to update project status:', statusError);
      }
    }

    return {
      success: true,
      newWorkProduct: { ...dbData, url: urlData.publicUrl },
      oldWorkProduct: hasExisting ? existingWorkProduct : undefined,
      message: hasExisting ? 'Work product replaced successfully' : 'Work product uploaded successfully'
    };

  } catch (error) {
    console.error('Error in uploadWorkProductWithReupload:', error);
    return {
      success: false,
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Get work product history for a project
 */
export const getWorkProductHistory = async (projectId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('work_products')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting work product history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting work product history:', error);
    return [];
  }
};

/**
 * Compare two work products
 */
export const compareWorkProducts = (oldProduct: any, newProduct: any) => {
  return {
    fileSizeChanged: oldProduct.file_size !== newProduct.file_size,
    fileTypeChanged: oldProduct.file_type !== newProduct.file_type,
    resolutionChanged: oldProduct.video_resolution !== newProduct.video_resolution,
    durationChanged: oldProduct.video_duration !== newProduct.video_duration,
    sizeDifference: newProduct.file_size - oldProduct.file_size,
    sizeDifferenceFormatted: formatFileSize(Math.abs(newProduct.file_size - oldProduct.file_size)),
    isLarger: newProduct.file_size > oldProduct.file_size
  };
};

/**
 * Validate re-upload permissions
 */
export const canReuploadWorkProduct = async (projectId: string, userId: string): Promise<boolean> => {
  try {
    // Check if user is the assigned freelancer for this project
    const { data: project, error } = await supabase
      .from('projects')
      .select('freelancer_id, project_status_workflow')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return false;
    }

    // Get freelancer profile to check user_id
    const { data: freelancerProfile } = await supabase
      .from('freelancer_profiles')
      .select('user_id')
      .eq('freelancer_id', project.freelancer_id)
      .single();

    // Check if user is the assigned freelancer
    const isAssignedFreelancer = freelancerProfile?.user_id === userId;

    // Check if project is in a state that allows re-uploads
    const allowedStatuses = [
      'Production in Progress',
      'AI Verified',
      'Under Manual Revision'
    ];
    const isAllowedStatus = allowedStatuses.includes(project.project_status_workflow);

    return isAssignedFreelancer && isAllowedStatus;
  } catch (error) {
    console.error('Error checking re-upload permissions:', error);
    return false;
  }
};

/**
 * Get re-upload statistics
 */
export const getReuploadStats = async (projectId: string) => {
  try {
    const history = await getWorkProductHistory(projectId);
    
    if (history.length === 0) {
      return {
        totalUploads: 0,
        currentVersion: null,
        previousVersions: [],
        hasHistory: false
      };
    }

    const currentVersion = history[0]; // Most recent
    const previousVersions = history.slice(1);

    return {
      totalUploads: history.length,
      currentVersion,
      previousVersions,
      hasHistory: history.length > 1,
      lastUploadDate: currentVersion.created_at,
      firstUploadDate: history[history.length - 1].created_at
    };
  } catch (error) {
    console.error('Error getting re-upload stats:', error);
    return {
      totalUploads: 0,
      currentVersion: null,
      previousVersions: [],
      hasHistory: false
    };
  }
};

/**
 * Enhanced video access that handles multiple versions
 */
export const accessVideoWithHistory = async (projectId: string, version?: 'latest' | 'previous' | number) => {
  try {
    const history = await getWorkProductHistory(projectId);
    
    if (history.length === 0) {
      return {
        success: false,
        error: 'No work products found for this project'
      };
    }

    let targetProduct;
    
    if (version === 'latest' || !version) {
      targetProduct = history[0];
    } else if (version === 'previous' && history.length > 1) {
      targetProduct = history[1];
    } else if (typeof version === 'number' && history[version]) {
      targetProduct = history[version];
    } else {
      return {
        success: false,
        error: 'Invalid version specified'
      };
    }

    // Use existing video access logic
    const { generateVideoUrl } = await import('./videoUtils');
    const url = generateVideoUrl(targetProduct.file_path);

    return {
      success: true,
      url,
      workProduct: targetProduct,
      version: version || 'latest',
      totalVersions: history.length
    };
  } catch (error) {
    console.error('Error accessing video with history:', error);
    return {
      success: false,
      error: `Video access failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}; 