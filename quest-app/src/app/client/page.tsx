'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppNavbar from '@/components/ui/appNavbar';
import Quests from './_components/quests';
import Scan from './_components/scan';
import Profile from './_components/profile';
import CameraBackground from '@/components/ui/cameraBackground';

function CameraRequiredPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center animate-fade-in max-w-xs">
        <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
        <div className="text-lg font-semibold text-gray-800 mb-4 text-center">
          This app requires camera access for scanning.<br />
          Please allow camera access in your browser settings.
        </div>
        <button
          onClick={onClose}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded mt-2"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
}

const scrollNavToIndex = (index: number) => {
  const nav = document.querySelector('nav');
  const button = nav?.children[index] as HTMLButtonElement;
  if (button && nav) {
    const scrollOffset =
    button.offsetLeft + button.offsetWidth / 2 - nav.clientWidth / 2;
    nav.scrollTo({ left: scrollOffset, behavior: 'smooth' });
  }
};

const fadeVariants = {
  initial: { opacity: 0, filter: 'blur(8px)', scale: 0.98 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

export default function AppPage() {
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isSwipeEnabled, setSwipeEnabled] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [questTab, setQuestTab] = useState<'ongoing' | 'upcoming' | 'completed'>('ongoing');
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  const touchStartX = useRef<number | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const scrollToSection = useCallback((index: number) => {
    setPreviousIndex(currentIndex);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Listen for the custom event from profile component
  useEffect(() => {
    const handleShowCompletedQuests = () => {
      setQuestTab('completed');
      scrollToSection(0); // Navigate to quests tab (index 0)
    };

    window.addEventListener('showCompletedQuests', handleShowCompletedQuests);
    
    return () => {
      window.removeEventListener('showCompletedQuests', handleShowCompletedQuests);
    };
  }, [scrollToSection]);

  const pages = [
    <Quests key="quests" initialTab={questTab} />,
    <Scan key="scan" setSwipeEnabled={setSwipeEnabled} cameraAvailable={cameraAvailable} />,
    <Profile key="profile" />,
  ];

  useEffect(() => {
    setIsScannerActive(currentIndex === 1); // 1 is the index of Scan page
  }, [currentIndex]);

  useEffect(() => {
    // Check camera availability on mount
    async function checkCamera() {
      try {
        // First check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log('MediaDevices not supported');
          setCameraAvailable(false);
          setShowCameraPopup(true);
          return;
        }

        // Check for camera devices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          console.log('No video input devices found');
          setCameraAvailable(false);
          setShowCameraPopup(true);
          return;
        }

        // Try to actually access the camera to verify it works
        let stream;
        try {
          // Suppress console errors during camera test
          const originalError = console.error;
          console.error = () => {};
          
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            } 
          });
          
          // Restore console.error
          console.error = originalError;
          
          // If we get here, camera is working
          setCameraAvailable(true);
        } catch (permissionError) {
          // Restore console.error
          setCameraAvailable(false);
          setShowCameraPopup(true);
        } finally {
          // Clean up stream if it was created
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      } catch (error) {
        setCameraAvailable(false);
        setShowCameraPopup(true);
      }
    }
    
    checkCamera();
  }, []);

  const handleSwipe = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipeEnabled) return;

    const startX = touchStartX.current;
    const endX = e.changedTouches[0].clientX;

    if (startX !== null) {
      const delta = endX - startX;
      if (Math.abs(delta) > 50) {
        if (delta < 0 && currentIndex < pages.length - 1) {
          scrollNavToIndex(currentIndex + 1);
          setTimeout(() => setCurrentIndex(currentIndex + 1), 100);
        } else if (delta > 0 && currentIndex > 0) {
          scrollNavToIndex(currentIndex - 1);
          setTimeout(() => setCurrentIndex(currentIndex - 1), 100);
        }
      }
    }
    touchStartX.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  return (
    <div className="relative h-screen overflow-hidden bg-transparent">
      {showCameraPopup && <CameraRequiredPopup onClose={() => setShowCameraPopup(false)} />}
      {/* Fade-switchable view */}
      <CameraBackground />
      <div
        className="h-full w-full absolute top-0 left-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleSwipe}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="h-full w-full overflow-y-auto"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {pages[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* NavBar stays fixed on bottom */}
      <AppNavbar
        currentIndex={currentIndex}
        onNavSelect={scrollToSection}        
      />
    </div>
  );
}