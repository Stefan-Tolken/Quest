import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ArrowLeft } from 'lucide-react';
import type { Artefact as ArtefactType } from '@/lib/mockData';

interface ArtefactDetailProps {
  artefact: ArtefactType | null;
  isOpen: boolean;
  onClose: () => void;
  startPosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export default function ArtefactDetail({ artefact, isOpen, onClose, startPosition, onVisibilityChange }: ArtefactDetailProps) {
  const detailRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Track visibility separately from isOpen to handle animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }
    // Don't set isVisible to false here - we'll do that after animation completes
  }, [isOpen]);
  
  // Toggle body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Hide search bar and nav bar
      const searchBar = document.querySelector('[class*="searchBar"]');
      const navBar = document.querySelector('nav');
      
      if (searchBar) {
        (searchBar as HTMLElement).style.display = 'none';
      }
      
      if (navBar) {
        (navBar as HTMLElement).style.display = 'none';
      }
    } else {
      document.body.style.overflow = '';
      
      // Show search bar and nav bar when closed
      const searchBar = document.querySelector('[class*="searchBar"]');
      const navBar = document.querySelector('nav');
      
      if (searchBar) {
        (searchBar as HTMLElement).style.display = '';
      }
      
      if (navBar) {
        (navBar as HTMLElement).style.display = '';
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      
      // Ensure elements are visible on unmount
      const searchBar = document.querySelector('[class*="searchBar"]');
      const navBar = document.querySelector('nav');
      
      if (searchBar) {
        (searchBar as HTMLElement).style.display = '';
      }
      
      if (navBar) {
        (navBar as HTMLElement).style.display = '';
      }
    };
  }, [isOpen]);
  
  // Handle the close action
  const handleClose = () => {
    if (isAnimating) return;
    performCloseAnimation();
  };
  
  // Animation for opening
  useEffect(() => {
    if (!detailRef.current || !startPosition || !isVisible || !artefact) return;
    
    // Only run opening animation when component is visible and supposed to be open
    if (isOpen) {
      performOpenAnimation();
    }
  }, [isOpen, isVisible, startPosition, artefact]);
  
  // Perform opening animation
  const performOpenAnimation = () => {
    if (!detailRef.current || !startPosition || !contentRef.current) return;
    
    const detail = detailRef.current;
    const content = contentRef.current;
    
    setIsAnimating(true);
    
    // Set initial position to match the card
    gsap.set(detail, {
      top: startPosition.top,
      left: startPosition.left,
      width: startPosition.width,
      height: startPosition.height,
      borderRadius: '0.75rem',
    });
    
    // Hide content initially
    gsap.set(content, { opacity: 0 });
    
    // Animate to full screen
    gsap.to(detail, {
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: 0,
      backgroundColor: 'white',
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        setIsAnimating(false);
      }
    });
    
    // Fade in content
    gsap.to(content, {
      opacity: 1,
      delay: 0.3,
      duration: 0.3
    });
  };
  
  // Perform closing animation
  const performCloseAnimation = () => {
    if (!detailRef.current || !startPosition || !contentRef.current) return;
    
    const detail = detailRef.current;
    const content = contentRef.current;
    
    setIsAnimating(true);
    
    // Fade out content first
    gsap.to(content, {
      opacity: 0,
      duration: 0.2
    });
    
    // Then animate back to card size
    gsap.to(detail, {
        top: startPosition.top,
        left: startPosition.left,
        width: startPosition.width,
        height: startPosition.height,
        borderRadius: '0.75rem',
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsAnimating(false);
          setIsVisible(false);
          onVisibilityChange?.(false);
          onClose();
        },
    });
  };
  
  if (!artefact || !isVisible) return null;
  
  return (
    <div 
      ref={detailRef}
      className="fixed z-50 bg-white overflow-hidden"
    >
      <div 
        ref={contentRef}
        className="w-full h-full overflow-y-auto p-6"
      >
        <button
          onClick={handleClose}
          disabled={isAnimating}
          className="fixed top-6 left-6 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="max-w-4xl mx-auto pt-16">
          <div className="relative w-full h-96 mb-8">
            <Image
              src={`https://picsum.photos/seed/${artefact.id}/1200/800`}
              alt={artefact.name}
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{artefact.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 mb-6">{artefact.description}</p>
              <p className="text-gray-700 mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, 
                nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl 
                nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl 
                aliquet nunc, quis aliquam nisl nunc quis nisl.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{artefact.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-sm text-gray-900">Approximately 2,000 years</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Origin</dt>
                  <dd className="mt-1 text-sm text-gray-900">Ancient Greece</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Material</dt>
                  <dd className="mt-1 text-sm text-gray-900">Marble</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                  <dd className="mt-1 text-sm text-gray-900">120cm × 80cm × 40cm</dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Historical Context</h2>
            <p className="text-gray-700 mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, 
              nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl 
              nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl 
              aliquet nunc, quis aliquam nisl nunc quis nisl.
            </p>
            <p className="text-gray-700 mb-6">
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim 
              ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip 
              ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate 
              velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <p className="text-gray-700">
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
              deserunt mollit anim id est laborum.
            </p>
          </div>
          
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={`https://picsum.photos/seed/${artefact.id}${i}/400/400`}
                    alt={`${artefact.name} - Image ${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}