'use client';

import { useState, useEffect } from 'react';
import QRScanner from '@/components/ui/QRScanner';
import { isMobile } from 'react-device-detect';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useQuest } from '@/context/questContext';
import ArtefactDetail from '@/components/ui/artefactDetails';
import { useToast } from '@/components/ui/toast';
import SubmitDialog from '@/components/ui/submitDialog';

export default function Scan({ setSwipeEnabled }: { setSwipeEnabled: (enabled: boolean) => void }) {
  const hasMounted = useHasMounted();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [viewArtefact, setViewArtefact] = useState(false);
  const [finalSubmission, setFinalSubmission] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle'|'success'|'error'|'already'|null>(null);
  const { showToast } = useToast();
  const { 
    activeQuest,
    submitArtefact: questSubmitArtefact,
    progress,
    isNextSequential
  } = useQuest();

  const handleScanSuccess = (decodedText: string) => {
    try {
      const parsedData = JSON.parse(decodedText);
      setScanResult(parsedData.artefactId);
    } catch (error) {
      console.error('Invalid QR code data:', error);
      setScanError('Invalid QR code data. Please try again.');
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
    setViewArtefact(false);
    setSwipeEnabled(true);
  };

  useEffect(() => {
    setIsScannerActive(true);
    return () => setIsScannerActive(false);
  }, []);

  if (!hasMounted) return null;

  const handleViewArtefact = () => {
    setViewArtefact(true);
    setFinalSubmission(false);
  };

  const handleClose = () => {
    setScanResult(null);
    setFinalSubmission(false);
    setSubmitStatus(null);
  }

  const handleSubmit = async () => {
    if (!activeQuest || !scanResult) return;
    setSubmitStatus(null);

    const artefactLength = activeQuest.artefacts.length;
    const currentArtefactLength = progress?.collectedArtefactIds.length;    
    
    try {
      const result = await questSubmitArtefact(scanResult);
      
      if (result.success) {
        if (currentArtefactLength + 1 >= artefactLength) {
          setFinalSubmission(true);
        }
        setSubmitStatus(result.status);
      } else {
        setSubmitStatus('error');
        // Show error message from centralized logic
        if (result.message) {
          setMessage(result.message);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      showToast('Error submitting. Try again.', 'error', 5000);
    }
  };

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
        </main>
      </div>
      ) : (<></>)}
      {(activeQuest && !viewArtefact) || finalSubmission ? (
        <>
          <SubmitDialog
            open={scanResult !== null}
            onClose={handleClose}
            scanResult={scanResult}
            submitStatus={submitStatus}
            message={message}
            activeQuest={activeQuest}
            handleSubmit={handleSubmit}
            handleViewArtefact={handleViewArtefact}
            finalSubmission={finalSubmission}
          />
        </>
      ) : (
          <ArtefactDetail
            artefactId={scanResult} // Extracting the ID from the scan result
            isOpen={!!scanResult}
            onClose={handleDetailClose}
            finalSubmission={finalSubmission}
            onVisibilityChange={(visible) => {
              setSwipeEnabled(!visible);
            }}
          />
        )}
    </>
  );
}