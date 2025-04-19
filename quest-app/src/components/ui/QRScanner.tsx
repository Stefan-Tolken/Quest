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
  qrbox?: number | {width: number, height: number};
  aspectRatio?: number;
  disableFlip?: boolean;
  verbose?: boolean;
  preferredCamera?: 'environment' | 'user';
  isActive?: boolean;
  fullView?: boolean;
};

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
  fullView = false,
}: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const initializeScanner = async () => {
    if (!isActive || !scannerContainerRef.current) return;

    try {
      // Test camera access first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: preferredCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      stream.getTracks().forEach(track => track.stop());

      const config = {
        fps,
        qrbox: fullView ? undefined : qrbox,
        aspectRatio,
        disableFlip,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      };

      scannerRef.current = new Html5QrcodeScanner(
        scannerContainerRef.current.id,
        config,
        verbose
      );

      const errorCallback: QrcodeErrorCallback = (errorMessage) => {
        // Completely ignore "not found" errors
        if (!errorMessage.toLowerCase().includes('no qr code found')) {
          onScanError(errorMessage);
        }
      };

      await scannerRef.current.render(onScanSuccess, errorCallback);
      setCameraInitialized(true);
      onScannerInit(true);
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setCameraInitialized(false);
      onScannerInit(false);
      if (error instanceof Error) {
        onScanError(error.message);
      }
    }
  };

  useEffect(() => {
    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      setCameraInitialized(false);
    };
  }, [isActive, preferredCamera]);

  return (
    <div className="relative w-full h-full">
      <div
        id="qr-scanner-container"
        ref={scannerContainerRef}
        className="w-full h-full"
      />
      
      {!cameraInitialized && (
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
    </div>
  );
}