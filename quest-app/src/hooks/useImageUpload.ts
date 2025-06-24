import { useState, useCallback } from 'react';

interface UploadProgress {
  progress: number;
  status: string;
  isUploading: boolean;
}

interface UseImageUploadOptions {
  uploadType?: 'artifact' | 'restoration' | 'general';
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { uploadType = 'general', onSuccess, onError } = options;
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: '',
    isUploading: false,
  });

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setUploadProgress({
      progress: 0,
      status: 'Preparing upload...',
      isUploading: true,
    });

    try {
      // Check file size (limit to 10MB for images)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      setUploadProgress(prev => ({
        ...prev,
        progress: 10,
        status: 'Getting upload permission...',
      }));

      // Get presigned URL
      const response = await fetch('/api/generate-image-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          uploadType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload permission');
      }

      const { signedUrl, finalUrl } = await response.json();

      setUploadProgress(prev => ({
        ...prev,
        progress: 25,
        status: 'Uploading to cloud...',
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
              status: `Uploading... ${progress}%`,
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploadProgress(prev => ({
              ...prev,
              progress: 100,
              status: 'Upload complete!',
            }));
            resolve(finalUrl);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'));
        });

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Verify upload
      const verifyResponse = await fetch(uploadResult);
      if (!verifyResponse.ok) {
        console.warn('Upload completed but verification failed');
      }

      onSuccess?.(uploadResult);
      return uploadResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
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
  }, [uploadType, onSuccess, onError]);

  const resetUpload = useCallback(() => {
    setUploadProgress({
      progress: 0,
      status: '',
      isUploading: false,
    });
  }, []);

  return {
    uploadImage,
    uploadProgress,
    resetUpload,
  };
};