'use client';

import { 
  Html5QrcodeScanner, 
  Html5QrcodeScanType,
  QrcodeErrorCallback 
} from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

type QrScannerProps = {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanError?: (errorMessage: string) => void;
  onScannerInit?: (isInitialized: boolean) => void;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
  verbose?: boolean;
  preferredCamera?: 'environment' | 'user';
  isActive?: boolean;
};

interface ScannerError {
  type: 'permission' | 'not_readable' | 'not_found' | 'other';
  message: string;
}

export default function QrScanner({
  onScanSuccess,
  onScanError = () => {},
  onScannerInit = () => {},
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
  verbose = false,
  preferredCamera = 'environment',
  isActive = true,
}: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [cameraError, setCameraError] = useState<ScannerError | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const handleError = (error: Error): ScannerError => {
    const errorMessage = error.message.toLowerCase();
    let errorType: ScannerError['type'] = 'other';
    
    if (errorMessage.includes('permission')) {
      errorType = 'permission';
    } else if (errorMessage.includes('not readable')) {
      errorType = 'not_readable';
    } else if (errorMessage.includes('not found')) {
      errorType = 'not_found';
    }

    return {
      type: errorType,
      message: error.message
    };
  };

  const checkCameraPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Camera access denied');
      setCameraError(handleError(error));
      return false;
    }
  };

  const initializeScanner = async () => {
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
      onScannerInit(false);
      return;
    }

    const config = {
      fps,
      qrbox,
      aspectRatio,
      disableFlip,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true,
    };

    scannerRef.current = new Html5QrcodeScanner(
      scannerContainerRef.current!.id,
      config,
      verbose
    );

    const errorCallback: QrcodeErrorCallback = (errorMessage) => {
      if (!errorMessage.includes('No QR code found')) {
        onScanError(errorMessage);
      }
    };

    try {
      await scannerRef.current.render(onScanSuccess, errorCallback);
      setCameraInitialized(true);
      onScannerInit(true);
    } catch (error) {
      const formattedError = handleError(error instanceof Error ? error : new Error('Scanner initialization failed'));
      setCameraError(formattedError);
      setCameraInitialized(false);
      onScannerInit(false);
      onScanError(formattedError.message);
    }
  };

  useEffect(() => {
    if (!isActive || !scannerContainerRef.current) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      setCameraInitialized(false);
      return;
    }

    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      setCameraInitialized(false);
    };
  }, [isActive, preferredCamera]);

  const getErrorHelpText = (error: ScannerError) => {
    switch (error.type) {
      case 'permission':
        return 'Please enable camera permissions in your browser settings';
      case 'not_readable':
        return 'Camera is already in use or not accessible';
      case 'not_found':
        return 'No camera found on this device';
      default:
        return 'Please try again or use a different device';
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        id="qr-scanner-container"
        ref={scannerContainerRef}
        className="w-full h-full"
      />
      
      {!cameraInitialized && !cameraError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/70 z-20"
          onClick={() => initializeScanner()}
        >
          <div className="text-center p-4">
            <p className="text-white font-medium">Tap to activate camera</p>
            <p className="text-white text-sm mt-1">You may need to allow camera access</p>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center z-20">
          <div>
            <p className="font-bold mb-2">Camera Error</p>
            <p className="mb-1">{cameraError.message}</p>
            <p className="text-sm mb-4">{getErrorHelpText(cameraError)}</p>
            <button 
              onClick={() => {
                setCameraError(null);
                initializeScanner();
              }}
              className="px-4 py-2 bg-white/20 rounded hover:bg-white/30"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}