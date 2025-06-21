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
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track submission in progress
  const { showToast } = useToast();
  const { 
    activeQuest,
    submitArtefact: questSubmitArtefact,
    progress,
    isNextSequential
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
    setIsSubmitting(false); // Reset submission status when closing
  }

  const handleSubmit = async () => {
    if (!activeQuest || !scanResult) return;
    
    // Prevent double submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Calculate how many artifacts are left to collect after this submission
    const totalArtefacts = activeQuest.artefacts.length;
    const currentlyCollected = progress?.collectedArtefactIds?.length || 0;
    const remainingAfterThis = totalArtefacts - (currentlyCollected + 1);
    
    try {
      const result = await questSubmitArtefact(scanResult);
      
      if (result.success) {
        // Set finalSubmission if this was the last artifact or only one remains
        if (remainingAfterThis <= 0) {
          setFinalSubmission(true);
        }
        setSubmitStatus(result.status);
      } else {
        setSubmitStatus('error');
        // Show error message from centralized logic
        if (result.message) {
          setMessage(result.message);
        }
        setIsSubmitting(false); // Re-enable submit button on error
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      showToast('Error submitting. Try again.', 'error', 5000);
      setIsSubmitting(false); // Re-enable submit button on error
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
            isSubmitting={isSubmitting} // Pass the submission state to the dialog
          />
        </>
      ) : (
          <ArtefactDetail
            artefactId={scanResult} // Extracting the ID from the scan result
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