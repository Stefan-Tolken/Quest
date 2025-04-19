'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppNavbar from '@/components/ui/appNavbar';
import Quests from './_components/quests';
import Scan from './_components/scan';
import Artefacts from './_components/artefacts';
import Profile from './_components/profile';
import CameraBackground from '@/components/ui/cameraBackground';

const pages = [<Quests />, <Scan />, <Artefacts />, <Profile />];

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
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentIndex');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });

  useEffect(() => {
    localStorage.setItem('currentIndex', currentIndex.toString());
  }, [currentIndex]);

  const touchStartX = useRef<number | null>(null);

  const handleSwipe = (e: React.TouchEvent<HTMLDivElement>) => {
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

  const scrollToSection = (index: number) => {
    setPreviousIndex(currentIndex); // Save current before changing
    setCurrentIndex(index);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-transparent">
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

      {/* NavBar stays fixed on top */}
      <AppNavbar
        currentIndex={currentIndex}
        onNavSelect={scrollToSection}        
      />
    </div>
  );
}