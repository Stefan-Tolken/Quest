import { useState, useCallback, useRef } from "react";

interface UploadProgress {
  progress: number;
  status: string;
  isUploading: boolean;
}

interface Use3DModelUploadOptions {
  onSuccess?: (url: string, key: string) => void;
  onError?: (error: string) => void;
}

export const use3DModelUpload = (options: Use3DModelUploadOptions = {}) => {
  const { onSuccess, onError } = options;
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: '',
    isUploading: false,
  });

  // Keep track of uploaded files that haven't been saved yet
  const pendingUploadsRef = useRef<Set<string>>(new Set());

  const uploadModel = useCallback(async (file: File): Promise<string> => {
    setUploadProgress({
      progress: 0,
      status: 'Preparing 3D model upload...',
      isUploading: true,
    });

    try {
      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`📁 3D Model selected: ${file.name}, Size: ${fileSizeMB.toFixed(2)}MB`);
      
      if (fileSizeMB > 100) { // 100MB warning for 3D models
        console.log(`Large 3D model detected: ${fileSizeMB.toFixed(1)}MB - upload may take longer`);
        setUploadProgress(prev => ({
          ...prev,
          status: `Preparing large 3D model (${fileSizeMB.toFixed(1)}MB)...`,
        }));
      }

      // Validate file type
      if (!file.name.endsWith('.glb')) {
        throw new Error('Please select a valid .glb file.');
      }

      setUploadProgress(prev => ({
        ...prev,
        progress: 10,
        status: 'Getting upload permission...',
      }));

      // Get presigned URL
      const response = await fetch('/api/generate-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'model/gltf-binary',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Presigned URL error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to get upload permission: ${response.status}`);
      }

      const { signedUrl, key } = await response.json();
      console.log('✅ Got presigned URL and key:', key);
      
      // Add to pending uploads tracking
      pendingUploadsRef.current.add(key);

      setUploadProgress(prev => ({
        ...prev,
        progress: 25,
        status: fileSizeMB > 100 ? `Uploading large 3D model (${fileSizeMB.toFixed(1)}MB)...` : 'Uploading 3D model to cloud...',
      }));

      // Upload with progress tracking
      const uploadResult = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round(25 + (event.loaded / event.total) * 70);
            setUploadProgress(prev => ({
              ...prev,
              progress,
              status: `Uploading 3D model... ${progress}%`,
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploadProgress(prev => ({
              ...prev,
              progress: 95,
              status: 'Finalizing upload...',
            }));
            
            const finalUrl = `/api/get-3dModel?key=${encodeURIComponent(key)}`;
            resolve(finalUrl);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        // Extended timeout for large 3D models
        xhr.timeout = fileSizeMB > 100 ? 15 * 60 * 1000 : 10 * 60 * 1000; 

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timed out - file may be too large'));
        });

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'model/gltf-binary');
        xhr.send(file);
      });

      setUploadProgress(prev => ({
        ...prev,
        progress: 100,
        status: '3D model upload complete!',
      }));

      console.log('✅ 3D model uploaded successfully:', uploadResult);
      onSuccess?.(uploadResult, key);
      return uploadResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ 3D model upload failed:', error);
      
      setUploadProgress(prev => ({
        ...prev,
        status: `Upload failed: ${errorMessage}`,
        isUploading: false,
      }));
      
      onError?.(errorMessage);
      throw error;
    } finally {
      // Reset upload state after 3 seconds
      setTimeout(() => {
        setUploadProgress({
          progress: 0,
          status: '',
          isUploading: false,
        });
      }, 3000);
    }
  }, [onSuccess, onError]);

  // Function to clean up uploaded file if save is cancelled
  const cleanupPendingUpload = useCallback(async (key: string) => {
    if (!pendingUploadsRef.current.has(key)) return;
    
    try {
      console.log('🗑️ Cleaning up unused upload:', key);
      const response = await fetch('/api/delete-temp-upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      
      if (response.ok) {
        console.log('✅ Temporary upload cleaned up');
        pendingUploadsRef.current.delete(key);
      } else {
        console.warn('⚠️ Failed to clean up temporary upload:', key);
      }
    } catch (error) {
      console.error('❌ Error cleaning up temporary upload:', error);
    }
  }, []);

  // Function to mark upload as permanently saved
  const markAsSaved = useCallback((key: string) => {
    pendingUploadsRef.current.delete(key);
    console.log('✅ Upload marked as permanently saved:', key);
  }, []);

  // Clean up all pending uploads on unmount
  const cleanupAllPending = useCallback(async () => {
    const pendingKeys = Array.from(pendingUploadsRef.current);
    for (const key of pendingKeys) {
      await cleanupPendingUpload(key);
    }
  }, [cleanupPendingUpload]);

  const resetUpload = useCallback(() => {
    setUploadProgress({
      progress: 0,
      status: '',
      isUploading: false,
    });
  }, []);

  return {
    uploadModel,
    uploadProgress,
    resetUpload,
    cleanupPendingUpload,
    markAsSaved,
    cleanupAllPending,
  };
};