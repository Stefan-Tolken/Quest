'use client';

import { useState, useEffect } from 'react';
import QRScanner from '@/components/ui/QRScanner';
import { isMobile } from 'react-device-detect';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useQuest } from '@/context/questContext';
import ArtefactDetail from '@/components/ui/artefactDetails';
import { useToast } from '@/components/ui/toast';
import SubmitDialog from '@/components/ui/submitDialog';

// No Camera Fallback Component
function NoCameraFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="glass rounded-lg shadow-lg p-8 flex flex-col items-center animate-fade-in max-w-xs">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </svg>
        <h3 className="text-lg font-semibold text-red-500 mb-2">Camera Not Available</h3>
        <p className="text-foregroundmb-4 text-center">
          QR scanning requires camera access. Please enable camera permissions or try on a device with a camera.
        </p>
      </div>
    </div>
  );
}

export default function Scan({ 
  setSwipeEnabled, 
  cameraAvailable
}: { 
  setSwipeEnabled: (enabled: boolean) => void;
  cameraAvailable: boolean | null;
}) {
  const hasMounted = useHasMounted();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [viewArtefact, setViewArtefact] = useState(false);
  const [finalSubmission, setFinalSubmission] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle'|'success'|'error'|'already'|null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { 
    activeQuest,
    submitArtefact: questSubmitArtefact,
    progress,
    isNextSequential,
    getNextHint
  } = useQuest();

  const handleScanSuccess = (decodedText: string) => {
    try {
      // Check if the scanned text is a URL
      if (decodedText.startsWith('http')) {
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
    // Completely suppress all scan errors when camera is not available
    if (!cameraAvailable) return;
    
    // Only show relevant errors when camera is available
    if (!error.toLowerCase().includes('no qr code found') && 
        !error.toLowerCase().includes('could not start video source')) {
      setScanError(error);
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const handleScannerInit = (success: boolean) => {
    // Only handle initialization feedback when camera should be available
    if (!cameraAvailable) return;
    
    if (!success && !scanError) {
      setScanError('Failed to initialize camera. Please try again.');
    }
  };

  const handleDetailClose = () => {
    setScanResult(null);
    setViewArtefact(false);
    setSwipeEnabled(true);
  };

  useEffect(() => {
    // Only activate scanner if camera is available
    if (cameraAvailable) {
      setIsScannerActive(true);
    }
    return () => setIsScannerActive(false);
  }, [cameraAvailable]);

  if (!hasMounted) return null;

  const handleViewArtefact = () => {
    setViewArtefact(true);
    setFinalSubmission(false);
  };

  const handleClose = () => {
    setScanResult(null);
    setFinalSubmission(false);
    setSubmitStatus(null);
    setIsSubmitting(false);
  }

  const getHint = () => {

    const index = progress?.collectedArtefactIds.length || 0;
    const attempts = progress?.attempts;
    const hints = activeQuest?.artefacts[index].hints || [];
    const safeAttempts = Math.max(0, Math.min((hints.length - 1), attempts ?? 0));
    const hint = hints[safeAttempts];

    console.log(`artefact at index: ${index} is ${activeQuest?.artefacts[index].artefactId}`);
    console.log('attempts:', attempts);
    console.log('safeAttempts:', safeAttempts);
    console.log('hint:', hint.description);

    return hint.description;
  }

  const handleSubmit = async () => {
    if (!activeQuest || !scanResult) return;
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    const totalArtefacts = activeQuest.artefacts.length;
    const currentlyCollected = progress?.collectedArtefactIds?.length || 0;
    const remainingAfterThis = totalArtefacts - (currentlyCollected + 1);
    
    try {
      const result = await questSubmitArtefact(scanResult);
      
      if (result.success) {
        if (remainingAfterThis <= 0) {
          setFinalSubmission(true);
        }
        setSubmitStatus(result.status);
      } else {
        // Set the correct status - use 'already' if that's what the result says
        if (result.status === 'already') {
          setSubmitStatus('already'); // Set to 'already' instead of 'error'
          setMessage('Already submitted.');
        } else {
          setSubmitStatus('error');
          if (result.message) {
            setMessage(result.message);
          } else {
            // Get next hint only for genuine errors, not for "already" status
            const nextHint = getNextHint();
            setMessage(nextHint?.description ? `Hint: ${nextHint.description}` : 'Try another artifact.');
          }
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      showToast('Error submitting. Try again.', 'error', 5000);
      setIsSubmitting(false);
    }
  };

  // Show different content based on camera availability
  if (cameraAvailable === false) {
    return <NoCameraFallback />;
  }

  // Show loading state while checking camera
  if (cameraAvailable === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
          <p className="text-white/80">Checking camera...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!scanResult && cameraAvailable ? (
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
      ) : null}
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
            isSubmitting={isSubmitting}
          />
        </>
      ) : (
          <ArtefactDetail
            artefactId={scanResult}
            isOpen={!!scanResult}
            onClose={handleDetailClose}
            onVisibilityChange={(visible) => {
              setSwipeEnabled(!visible);
            }}
          />
        )}
    </>
  );
}