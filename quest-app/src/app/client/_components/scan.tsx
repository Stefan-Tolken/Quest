'use client';

import { useState, useEffect } from 'react';
import QrScanner from '@/components/ui/QRScanner';
import { isMobile } from 'react-device-detect';
//Temp imports for demo purposes
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Scan() {
  //Temp code for demo purposes
  const router = useRouter();
  //Temp code for demo purposes
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanSuccess = (decodedText: string) => {
    setScanResult(decodedText);
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    console.log('Scanned:', decodedText);
  };

  const handleScanError = (error: string) => {
    // Only show meaningful errors (not "no QR found" messages)
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

  useEffect(() => {
    setIsScannerActive(true);
    return () => {
      setIsScannerActive(false);
    };
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-md">
        <h1 className="text-2xl font-bold text-white">Scan QR Code</h1>
        
        <div className="relative w-full aspect-square max-w-md rounded-2xl overflow-hidden">
          {/* Full-screen scanner with visual overlay */}
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            onScannerInit={handleScannerInit}
            qrbox={isMobile ? undefined : 250} // Full view on mobile
            fps={10}
            preferredCamera="environment"
            isActive={isScannerActive}
            fullView={isMobile}
          />

          {/* Visual scanning window overlay (purely cosmetic) */}
          {!isMobile && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white/50 rounded-xl">
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />
                </div>
              </div>
            </div>
          )}
        </div>

        {scanResult && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm w-full">
            <p className="text-black font-medium">Scanned content:</p>
            <p className="text-black font-mono break-all mt-2">{scanResult}</p>
          </div>
        )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* Temp button for demo purposes */}
        <Button
          onClick={() => router.push('/client/artefact/artefact-002')}
          variant={'secondary'}
        >
          Scan Artefact
        </Button>
      </footer>
    </div>
  );
}