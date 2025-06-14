'use client';

import { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanError: (errorMessage: string) => void;
  onScannerInit: (success: boolean) => void;
  isActive: boolean;
  preferredCamera?: string;
  fullView?: boolean;
}

export default function QRScanner({
  onScanSuccess,
  onScanError,
  onScannerInit,
  isActive,
  preferredCamera = 'environment',
  fullView = false,
}: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store container reference for cleanup
    const container = containerRef.current;

    const videoElem = document.createElement('video');
    videoElem.setAttribute('playsinline', 'true');
    videoElem.style.position = 'absolute';
    videoElem.style.minWidth = '100%';
    videoElem.style.minHeight = '100%';
    videoElem.style.objectFit = 'cover';

    videoRef.current = videoElem;
    container.appendChild(videoElem);

    const scanner = new QrScanner(
      videoElem,
      (result) => {
        if (typeof result === 'string') {
          onScanSuccess(result, null);
        } else {
          onScanSuccess(result.data, result);
        }
      },
      {
        onDecodeError: (error) => {
          const message = error instanceof Error ? error.message : String(error);
          onScanError(message);
        },
        preferredCamera,
        returnDetailedScanResult: true,
      }
    );
    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => onScannerInit(true))
      .catch((err) => {
        console.error('Failed to start QR scanner:', err);
        onScannerInit(false);
        onScanError(err.message);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      if (videoRef.current && container?.contains(videoRef.current)) {
        container.removeChild(videoRef.current);
      }
    };
  }, [isActive, preferredCamera, onScanSuccess, onScanError, onScannerInit]);

  return (
    <div
      ref={containerRef}
      className="relative w-[300px] h-[300px] rounded-2xl overflow-hidden bg-transparent glass"
    />
  );
}