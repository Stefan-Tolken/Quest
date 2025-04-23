import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { Artefact as ArtefactType } from '@/lib/mockData';
import { mockArtefacts } from '@/lib/mockData';

interface ArtefactDetailProps {
  artefactId: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  startPosition: {
    top: number | string;
    left: number | string;
    width: number;
    height: number;
  } | null;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export default function ArtefactDetail({ 
  artefactId,
  isOpen,
  onClose,
  startPosition, // Kept for future animation reimplementation
  onVisibilityChange 
}: ArtefactDetailProps) {
  const [artefact, setArtefact] = useState<ArtefactType | null>(null);
  
  // Fetch artefact when ID changes
  useEffect(() => {
    if (!artefactId) return;
    
    // Replace with actual API call in production
    const foundArtefact = mockArtefacts.find(a => a.id === artefactId);
    setArtefact(foundArtefact || null);
  }, [artefactId]);

  const detailRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // IMPORTANT: isVisible state is used by parent components for swipe functionality
  const [isVisible, setIsVisible] = useState(false);
  
  // Update visibility based on isOpen prop (needed for parent swipe functionality)
  useEffect(() => {
    if (isOpen) {
      // When opening, immediately set visible and notify parent
      setIsVisible(true);
      onVisibilityChange?.(true);
    } else {
      // When closing, immediately set not visible and notify parent
      setIsVisible(false);
      onVisibilityChange?.(false);
    }
  }, [isOpen, onVisibilityChange]);

  // Basic body scroll blocking
  useEffect(() => {
    if (isOpen) {
      //get navbar element and hide it
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.classList.add('hidden');
      }
      document.body.style.overflow = 'hidden';
    } else {
      //get navbar element and show it
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.classList.remove('hidden');
      }
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const handleClose = () => {
    onClose();
  };
  
  if (!artefact || !isVisible) return null;
  
  return (
    <div 
      ref={detailRef}
      className="fixed top-0 left-0 z-50 bg-white w-full h-full overflow-hidden"
    >
      <div 
        ref={contentRef}
        className="w-full h-full overflow-y-auto p-6"
      >
        <button
          onClick={handleClose}
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