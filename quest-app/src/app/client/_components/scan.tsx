'use client';

import { useState, useEffect } from 'react';
import QRScanner from '@/components/ui/QRScanner';
import { isMobile } from 'react-device-detect';
{/* Temp code for demo */}
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
{/* Temp code for demo */}
import { useHasMounted } from '@/hooks/useHasMounted';
import QRCodeGenerator from '@/components/QRGenerator';
import ArtefactDetail from '@/components/ui/artefactDetails';

export default function Scan({ setSwipeEnabled }: { setSwipeEnabled: (enabled: boolean) => void }) {
  const hasMounted = useHasMounted();
  {/* Temp code for demo */}
  const router = useRouter();
  {/* Temp code for demo */}
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanSuccess = (decodedText: string) => {
    try {
      // Check if the scanned text is a URL
      if (decodedText.startsWith('https')) {
        // Extract artifact ID from URL query parameter
        const url = new URL(decodedText);
        const artifactId = url.searchParams.get('id');
        if (artifactId) {
          setScanResult(artifactId);
          return;
        } else {
          // URL but not a recognized artifact path
          setScanError('Unfamiliar QR code detected. This is not a valid artifact QR code.');
          setTimeout(() => setScanError(null), 3000);
          return;
        }
      }

      // Fallback to JSON parsing if not a URL or URL parsing failed
      const parsedData = JSON.parse(decodedText);
      if (parsedData && parsedData.artefactId) {
        setScanResult(parsedData.artefactId);
        return;
      } else {
        setScanError('Unfamiliar QR code detected. This is not a valid artifact QR code.');
        setTimeout(() => setScanError(null), 3000);
        return;
      }
    } catch (error) {
      // Not a valid URL or JSON
      setScanError('Unfamiliar QR code detected. This is not a valid artifact QR code.');
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const handleScanError = (error: string) => {
    if (!error.toLowerCase().includes('no qr code found')) {
      setScanError(error);
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const handleScannerInit = (success: boolean) => {
    if (!success && !scanError) {
      setScanError('Failed to initialize camera. Please try again.');
    }
  };

  const handleDetailClose = () => {
    // Only update state - the animation handles the actual closing
    setScanResult(null);
  };

  const detailPosition = {
      top: '50%',
      left: '50%',
      width: 0,
      height: 0
  };

  useEffect(() => {
    setIsScannerActive(true);
    return () => setIsScannerActive(false);
  }, []);

  if (!hasMounted) return null;

  return (
    <>
      {!scanResult ? (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-md">
            
              <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onScannerInit={handleScannerInit}
              preferredCamera="environment"
              isActive={isScannerActive}
              fullView={isMobile}
              />
            {/* Temp code for demo */}
          </main>

          <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
          </footer>
        </div>
      ) : (<></>)}
        <ArtefactDetail
          artefactId={scanResult} // Extracting the ID from the scan result
          isOpen={!!scanResult}
          onClose={handleDetailClose}
          onVisibilityChange={(visible) => {
            setSwipeEnabled(!visible);
          }}
        />
    </>
  );
}